globalThis.process = globalThis.process || {env: {}};
globalThis.process.env.NODE_ENV = 'test';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
if (!document.getElementById('main-content')) { const root = document.createElement('div'); root.id = 'main-content'; document.body.append(root); }
