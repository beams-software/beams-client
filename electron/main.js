import {app, BrowserWindow, Menu} from 'electron';
import serve from 'electron-serve';

const loadURL = serve({directory: 'out'});

let mainWindow;

(async () => {
await app.whenReady();

mainWindow = new BrowserWindow();
Menu.setApplicationMenu(null)
mainWindow.setKiosk(false)
// The above is equivalent to this:
await mainWindow.loadURL('app://-');
// The `-` is just the required hostname.
})();