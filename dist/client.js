var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ExtensionClient_requests, _ExtensionClient_extensionIdPromise, _ExtensionClient_handleEvent;
class Deferred {
    constructor() {
        this.resolve = () => { };
        this.reject = () => { };
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
}
export class ExtensionClient {
    constructor(options) {
        var _a;
        this.options = options;
        _ExtensionClient_requests.set(this, new Map());
        _ExtensionClient_extensionIdPromise.set(this, new Deferred());
        _ExtensionClient_handleEvent.set(this, (event) => __awaiter(this, void 0, void 0, function* () {
            if (event.source !== window) {
                return;
            }
            if (!event.data || typeof event.data !== "object") {
                return;
            }
            const { requestId, type, error, payload } = event.data;
            if (!type || typeof type !== "string") {
                return;
            }
            if (type === "signify-extension") {
                __classPrivateFieldGet(this, _ExtensionClient_extensionIdPromise, "f").resolve(event.data.data.extensionId);
                return;
            }
            if (type === "/signify/reply" && requestId && typeof requestId === "string") {
                const promise = __classPrivateFieldGet(this, _ExtensionClient_requests, "f").get(requestId);
                if (!promise) {
                    return;
                }
                if (error) {
                    promise.reject(new Error(typeof error === "string" ? error : error.toString()));
                }
                else if (!payload || typeof payload !== "object") {
                    promise.reject(new Error("No payload received in response"));
                }
                else {
                    promise.resolve(payload);
                }
                __classPrivateFieldGet(this, _ExtensionClient_requests, "f").delete(requestId);
            }
        }));
        this.isExtensionInstalled = (...args_1) => __awaiter(this, [...args_1], void 0, function* (timeout = 3000) {
            const timer = setTimeout(() => {
                __classPrivateFieldGet(this, _ExtensionClient_extensionIdPromise, "f").resolve(false);
            }, timeout);
            const result = yield __classPrivateFieldGet(this, _ExtensionClient_extensionIdPromise, "f");
            clearTimeout(timer);
            return result;
        });
        /**
         * Sends a /signify/sign-request message to the extension.
         *
         * The extension decides whether or not it needs to prompt the user to approve the signing
         * or automatically sign the request.
         *
         * @param payload Information about the request that needs to be signed.
         * @returns
         */
        this.signRequest = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/sign-request", { payload });
        });
        /**
         * Sends a /signify/sign-data message to the extension.
         *
         * The extension should prompt the user to select a credential or identifier to sign with.
         *
         * @param payload The arguments to pass to the extension.
         * @returns {AuthorizeResult}
         */
        this.signData = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/sign-data", { payload });
        });
        /**
         * Sends a /signify/authorize message to the extension.
         *
         * The extension should prompt the user to select a credential or identifier,
         * on success, it should send a /signify/reply message back to the browser page.
         *
         * This method is used to start an authorized "session" with the extension. Depending
         * on the implemention, the extension can start to allow "signRequest" messages
         * after a successful authorization.
         *
         * @param payload The arguments to pass to the extension.
         * @returns {AuthorizeResult}
         */
        this.authorize = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/authorize", { payload });
        });
        /**
         * Sends a /signify/authorize message to the extension.
         *
         * The extension should prompt the user to select a identifier,
         * on success, it should send a /signify/reply message back to the browser page.
         *
         * This method is used to start an authorized "session" with the extension. Depending
         * on the implemention, the extension can start to allow "signRequest" messages
         * after a successful authorization.
         *
         * @param payload The arguments to pass to the extension.
         * @returns {AuthorizeResult}
         */
        this.authorizeAid = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/authorize/aid", { payload });
        });
        /**
         * Sends a /signify/authorize message to the extension.
         *
         * The extension should prompt the user to select a credential,
         * on success, it should send a /signify/reply message back to the browser page.
         *
         * This method is used to start an authorized "session" with the extension. Depending
         * on the implemention, the extension can start to allow "signRequest" messages
         * after a successful authorization.
         *
         * @param payload The arguments to pass to the extension.
         * @returns {AuthorizeResult}
         */
        this.authorizeCred = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/authorize/credential", { payload });
        });
        /**
         * Sends a /signify/get-session-info message to the extension.
         * prereq:
         * once webapp has received an authorized result, a session is created on the extension
         *
         * Upon successfull session, this method is used to receive previously
         * selected signature conditioned to its session validity. If session is expired this would throw an error.
         * Otherwise, it returns AuthorizeResult
         *
         * @param payload The arguments to pass to the extension.
         * @returns {AuthorizeResult}
         */
        this.getSessionInfo = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/get-session-info", { payload });
        });
        /**
         * Sends a /signify/clear-session message to the extension.
         *
         * This method is used to clear session with extension if exist.
         *
         * @param payload The arguments to pass to the extension.
         * @returns {AuthorizeResult}
         */
        this.clearSession = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/clear-session", { payload });
        });
        /**
          * Sends a /signify/credential/create/data-attestation message to the extension.
          *
          * The extension decides whether or not it needs to prompt the user to approve the signing
          * or automatically sign the request.
          *
          * Example of data attestation schema: https://github.com/provenant-dev/public-schema/blob/main/attestation/attestation.schema.json
          *
          * @param payload  Information about data attestation credential.
          * @returns {CreateCredentialResult}
          */
        this.createDataAttestationCredential = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/credential/create/data-attestation", { payload });
        });
        /**
         * Sends a /signify/credential/get message to the extension.
         *
         * The extension decides whether or not it needs to prompt the user to approve the signing
         * or automatically sign the request.
         *
         * @param said  credential SAID.
         * @param includeCESR  include credential CESR stream in response.
         * @returns {CredentialResult}
         */
        this.getCredential = (said_1, ...args_2) => __awaiter(this, [said_1, ...args_2], void 0, function* (said, includeCESR = false) {
            return this.sendMessage("/signify/credential/get", { payload: { id: said, includeCESR } });
        });
        /**
         * Configures the extension with the specified vendor.
         * @param payload The vendor configuration
         * @summary Tries to set the vendor url in the extension to load vendor supplied info e.g theme, logo etc.
         * @example
         * ```ts
         * await signifyClient.provideConfigUrl({url: "https://api.npoint.io/52639f849bb31823a8c0"});
         * ```
         * @remarks
         * This function is used to set the vendor url in the extension. The extension will fetch the vendor supplied info from the vendor url in json format.
         *
         * @see Template for [Vendor Loaded JSON](https://api.npoint.io/52639f849bb31823a8c0)
         */
        this.configureVendor = (payload) => __awaiter(this, void 0, void 0, function* () {
            return this.sendMessage("/signify/configure-vendor", { payload });
        });
        /**
         * Sends an arbitrary message to the extension.
         *
         * This method can be used if there is no shorthand method implemented yet
         * for the message that needs to be sent.
         *
         * The message will always contain the "type" property and a unique "requestId".
         * The second parameter will be spread, this allows you to add any additional properties to the request.
         *
         * ```typescript
         * {
         *    "type": string,
         *    "requestId": string,
         *    ...payload
         * }
         * ```
         *
         * @param type
         * @param payload
         * @returns
         */
        this.sendMessage = (type, payload) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const requestId = window.crypto.randomUUID();
            const promise = new Promise((resolve, reject) => {
                __classPrivateFieldGet(this, _ExtensionClient_requests, "f").set(requestId, {
                    resolve(value) {
                        resolve(value);
                    },
                    reject,
                });
            });
            window.postMessage(Object.assign({ requestId, type }, (payload !== null && payload !== void 0 ? payload : {})), (_b = this.options.targetOrigin) !== null && _b !== void 0 ? _b : "/");
            return promise;
        });
        this.sendMessage = this.sendMessage.bind(this);
        window.addEventListener("message", __classPrivateFieldGet(this, _ExtensionClient_handleEvent, "f"), false);
        // Sending a notification to the extension that a client has been loaded. This is to avoid
        // the condition where the extension sends the "signify-extension" message before the client is loaded.
        // The idea is that the extension should send a "signify-extension" on load, but also whenever it receives
        // a signify-extension-client message.
        window.postMessage({ type: "signify-extension-client" }, (_a = this.options.targetOrigin) !== null && _a !== void 0 ? _a : "/");
    }
}
_ExtensionClient_requests = new WeakMap(), _ExtensionClient_extensionIdPromise = new WeakMap(), _ExtensionClient_handleEvent = new WeakMap();
/**
 * Creates and returns a new extension client.
 * The created instance can be used to communicate with a compatible browser extension.
 *
 * @example
 * const client = createClient();
 * const authResult = await client.authorize({ message: "A message" });
 *
 * const signResult = await client.signRequest({
 *   url: "http://example.com",
 *   method: "GET"
 * });
 *
 * await fetch("http://example.com", { headers: signResult.headers })
 *
 *
 * @returns {ExtensionClient}
 */
export function createClient(options) {
    return new ExtensionClient(options !== null && options !== void 0 ? options : {});
}
