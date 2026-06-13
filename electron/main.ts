import { app, BrowserWindow, Menu, globalShortcut } from "electron"
import serve from "electron-serve"
import prompt from "electron-prompt"
import dgram from "dgram"
import os from "os";

const DISCOVERY_PORT = 12345
const DISCOVERY_MESSAGE = Buffer.from("DISCOVER_SERVER")

const computerName = os.hostname()

const client4 = dgram.createSocket("udp4")
client4.bind(() => {
  client4.setBroadcast(true)
})
const client6 = dgram.createSocket("udp6")
client6.bind(() => {})
var foundServer = false
var showAlertUDP = false

const sendDiscoveryMessages = () => {
  if (foundServer) return

  client4.send(DISCOVERY_MESSAGE, DISCOVERY_PORT, "255.255.255.255", (err) => {
    if (err) console.error("IPv4 error:", err)
    else console.log("IPv4 discovery message sent")
  })

  client6.send(DISCOVERY_MESSAGE, DISCOVERY_PORT, "ff02::1", (err) => {
    if (err) console.error("IPv6 error:", err)
    else console.log("IPv6 discovery message sent")
  })
}

const loadURL = serve({ directory: "out" })
var API_URL = ""
;(async () => {
  await app.whenReady()

  const mainWindow = new BrowserWindow()

  var interval = setInterval(sendDiscoveryMessages, 5000)
  sendDiscoveryMessages()

  Menu.setApplicationMenu(null)
  mainWindow.setKiosk(false)

  function startDiscovery() {
    clearInterval(interval)

    foundServer = false

    sendDiscoveryMessages()
    interval = setInterval(sendDiscoveryMessages, 5000)
  }

  async function setLocalStorage(key: string, value: string) {
    await mainWindow.webContents.executeJavaScript(
      `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)})`
    )
  }

  async function getLocalStorage(key: string) {
    return await mainWindow.webContents.executeJavaScript(
      `localStorage.getItem(${JSON.stringify(key)})`
    )
  }

  await setLocalStorage("computerName", computerName)

  client4.on("message", async (msg, rinfo) => {
    if (msg.toString().startsWith("SERVER_HERE")) {
      if (foundServer) return
      console.log(
        `ipv4 Found server at ${rinfo.address}:${msg.toString().split(":")[1]}`
      )
      foundServer = true
      clearInterval(interval)
      const apiURL = `http://${rinfo.address}:${msg.toString().split(":")[1]}`
      await setLocalStorage("API_URL", apiURL)
      mainWindow.reload()
      if (showAlertUDP) {
        showAlertUDP = false
        mainWindow.webContents.executeJavaScript(
          `alert('API RECEIVED: ${apiURL}')`
        )
      }
      //   mainWindow.loadURL(`http://${rinfo.address}:${config.PORT}/`);
      mainWindow.setKiosk(true)
    }
  })

  client6.on("message", async (msg, rinfo) => {
    if (msg.toString().startsWith("SERVER_HERE")) {
      if (foundServer) return
      console.log(
        `ipv6 Found server at ${rinfo.address.split("%")[0]}:${msg.toString().split(":")[1]}`
      )
      foundServer = true
      clearInterval(interval)
      const apiURL = `http://[${rinfo.address.split("%")[0]}]:${msg.toString().split(":")[1]}`
      await setLocalStorage("API_URL", apiURL)
      
      mainWindow.reload()
      if (showAlertUDP) {
        showAlertUDP = false
        mainWindow.webContents.executeJavaScript(
          `alert('API RECEIVED: ${apiURL}')`
        )
      }
      //   mainWindow.loadURL(`http://[${rinfo.address.split('%')[0]}]:${config.PORT}/`)
      mainWindow.setKiosk(true)
    }
  })

  globalShortcut.register("CommandOrControl+U", () => {
    mainWindow.close()
  })
  globalShortcut.register("CommandOrControl+Shift+F", () => {
    // mainWindow.setFullScreen(!mainWindow.fullScreen)
    mainWindow.setKiosk(!mainWindow.kiosk)
  })
  globalShortcut.register("CommandOrControl+Shift+R", () => {
    mainWindow.reload()
  })
  globalShortcut.register("CommandOrControl+Shift+D", () => {
    mainWindow.webContents.openDevTools()
  })

  globalShortcut.register("CommandOrControl+Shift+P", async () => {
    const apiURL = await prompt({
      title: "API",
      label: "Enter API:",
      value: await getLocalStorage("API_URL"),
      inputAttrs: {
        type: "url",
        required: "true",
      },
    })
    if (apiURL) {
      console.log(apiURL)
      await setLocalStorage("API_URL", apiURL || "")
    }
  })

  globalShortcut.register("CommandOrControl+Shift+U", () => {
    startDiscovery()
    showAlertUDP = true;
  })

  // The above is equivalent to this:
  await mainWindow.loadURL("app://-")
  // The `-` is just the required hostname.
})()
