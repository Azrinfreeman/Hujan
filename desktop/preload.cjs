const { contextBridge, ipcRenderer } = require('electron');
const call = (operation, argument = {}) => ipcRenderer.invoke('hujan',operation,argument);
contextBridge.exposeInMainWorld('hujan',Object.freeze({
  status:()=>call('status'),settings:()=>call('settings'),saveSettings:body=>call('saveSettings',body),
  personality:()=>call('personality'),savePersonality:body=>call('savePersonality',body),
  voiceSummaryStatus:()=>call('voiceSummaryStatus'),
  localSpeechStatus:()=>call('localSpeechStatus'),localSpeechSetup:()=>call('localSpeechSetup'),localSpeechCancel:()=>call('localSpeechCancel'),
  management:()=>call('management'),freshManagement:()=>call('freshManagement'),
  start:()=>call('start'),stop:()=>call('stop'),operation:id=>call('operation',{id}),
  clearStaleLocks:()=>call('clearStaleLocks'),
  testDiscord:()=>call('testDiscord'),testAI:()=>call('testAI'),testAIResponse:()=>call('testAIResponse'),
  registerCommands:()=>call('registerCommands'),authStatus:()=>call('authStatus'),authConnect:()=>call('authConnect'),
  authSwitch:()=>call('authSwitch'),authDisconnect:()=>call('authDisconnect'),authCancel:()=>call('authCancel'),
  importSelect:()=>call('importSelect'),importCommit:ticket=>call('importCommit',{ticket}),
}));
