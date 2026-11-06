'use strict';
// A fixed desktop bridge replaces HTTP; browser sessions keep their existing transport.
window.hujanRequest = async (path, options = {}) => {
  if (!window.hujan) return fetch(path,options);
  const method=options.method || 'GET';
  const routes={
    'GET /api/status':()=>window.hujan.status(),
    'GET /api/session':async()=>({authorized:true,csrf:'desktop'}),
    'GET /api/settings':()=>window.hujan.settings(),
    'GET /api/voice-summary':()=>window.hujan.voiceSummaryStatus(),
    'GET /api/voice-summary/local':()=>window.hujan.localSpeechStatus(),
    'POST /api/voice-summary/local/setup':()=>window.hujan.localSpeechSetup(),
    'POST /api/voice-summary/local/cancel':()=>window.hujan.localSpeechCancel(),
    'PUT /api/settings':()=>window.hujan.saveSettings(JSON.parse(options.body)),
    'GET /api/management':()=>window.hujan.management(),
    'GET /api/management?fresh=1':()=>window.hujan.freshManagement(),
    'POST /api/bot/start':()=>window.hujan.start(),
    'POST /api/bot/stop':()=>window.hujan.stop(),
    'POST /api/bot/clear-stale-locks':()=>window.hujan.clearStaleLocks(),
    'POST /api/settings/test-discord':()=>window.hujan.testDiscord(),
    'POST /api/settings/test-ai':()=>window.hujan.testAI(),
    'POST /api/settings/test-ai-response':()=>window.hujan.testAIResponse(),
  };
  let work=routes[`${method} ${path}`];
  const operation=/^\/api\/operations\/([a-f\d-]{36})$/.exec(path);
  if (method === 'GET' && operation) work=()=>window.hujan.operation(operation[1]);
  try {
    if(!work)throw new Error('Unsupported desktop operation.');
    const value=await work();return {ok:true,status:200,json:async()=>value};
  } catch(error) {return {ok:false,status:400,json:async()=>({error:error.message})};}
};
