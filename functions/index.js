const {onRequest} = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ maxInstances: 10 });
const {app} = require("./utils/main");

exports.lineBot = onRequest(app);