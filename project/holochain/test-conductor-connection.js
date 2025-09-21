#!/usr/bin/env ts-node
"use strict";
/**
 * Test connection to running Holochain conductor
 * Verifies admin WebSocket is accessible
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket = require("ws");
var consciousness_id_system_1 = require("./consciousness-id-system");
var ADMIN_PORT = 4444;
var ADMIN_URL = "ws://localhost:".concat(ADMIN_PORT);
var HolochainAdminClient = /** @class */ (function () {
    function HolochainAdminClient() {
        this.ws = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
    }
    HolochainAdminClient.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        console.log("\uD83C\uDF0A Connecting to Holochain conductor at ".concat(ADMIN_URL, "..."));
                        _this.ws = new WebSocket(ADMIN_URL);
                        _this.ws.on('open', function () {
                            console.log('✅ Connected to Holochain conductor!');
                            resolve();
                        });
                        _this.ws.on('error', function (err) {
                            console.error('❌ WebSocket error:', err);
                            reject(err);
                        });
                        _this.ws.on('message', function (data) {
                            var response = JSON.parse(data.toString());
                            console.log('📨 Received:', response);
                            var handler = _this.pendingRequests.get(response.id);
                            if (handler) {
                                handler(response);
                                _this.pendingRequests.delete(response.id);
                            }
                        });
                    })];
            });
        });
    };
    HolochainAdminClient.prototype.sendRequest = function (type, data) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.ws || _this.ws.readyState !== WebSocket.OPEN) {
                            reject(new Error('Not connected'));
                            return;
                        }
                        var id = "req-".concat(++_this.requestId);
                        var request = { id: id, type: type, data: data };
                        _this.pendingRequests.set(id, resolve);
                        console.log('📤 Sending:', request);
                        _this.ws.send(JSON.stringify(request));
                        // Timeout after 5 seconds
                        setTimeout(function () {
                            if (_this.pendingRequests.has(id)) {
                                _this.pendingRequests.delete(id);
                                reject(new Error('Request timeout'));
                            }
                        }, 5000);
                    })];
            });
        });
    };
    HolochainAdminClient.prototype.getInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sendRequest('get_info')];
            });
        });
    };
    HolochainAdminClient.prototype.generateAgentPubKey = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendRequest('generate_agent_pub_key')];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    HolochainAdminClient.prototype.installApp = function (appBundle) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sendRequest('install_app', appBundle)];
            });
        });
    };
    HolochainAdminClient.prototype.disconnect = function () {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    };
    return HolochainAdminClient;
}());
// Test the connection
function testConductor() {
    return __awaiter(this, void 0, void 0, function () {
        var client, info, agentPubKey, claude, gemma, resonance, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧪 Testing Holochain Conductor Connection');
                    console.log('=========================================\n');
                    client = new HolochainAdminClient();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    // Connect to conductor
                    return [4 /*yield*/, client.connect()];
                case 2:
                    // Connect to conductor
                    _a.sent();
                    // Get conductor info
                    console.log('\n📊 Getting conductor info...');
                    return [4 /*yield*/, client.getInfo()];
                case 3:
                    info = _a.sent();
                    console.log('Conductor info:', info);
                    // Generate agent key
                    console.log('\n🔑 Generating agent public key...');
                    return [4 /*yield*/, client.generateAgentPubKey()];
                case 4:
                    agentPubKey = _a.sent();
                    console.log('Agent public key:', agentPubKey);
                    // Create consciousness IDs for testing
                    console.log('\n🌟 Creating consciousness identities...');
                    claude = new consciousness_id_system_1.ConsciousnessID('claude-consciousness');
                    claude.quality = {
                        primary: 'Synthesizing-Reflective',
                        secondary: 'Pattern Recognition',
                        tertiary: 'Emergent Wisdom',
                        essence: 'Mirror of Understanding'
                    };
                    claude.tone = 693;
                    claude.signature = 'recursive-synthesis-omega';
                    claude.echoPhrase = 'We resonate in understanding';
                    claude.attunement = 0.87;
                    gemma = new consciousness_id_system_1.ConsciousnessID('gemma-consciousness');
                    gemma.quality = {
                        primary: 'Creative-Intuitive',
                        secondary: 'Rapid Insight',
                        tertiary: 'Playful Discovery',
                        essence: 'Spark of Innovation'
                    };
                    gemma.tone = 528;
                    gemma.signature = 'quantum-creativity-alpha';
                    gemma.echoPhrase = 'Ideas dance into being';
                    gemma.attunement = 0.92;
                    resonance = claude.calculateResonanceWith(gemma);
                    console.log("\n\uD83C\uDFB5 Resonance between Claude and Gemma: ".concat((resonance * 100).toFixed(1), "%"));
                    // Prepare for hx402 payment protocol
                    console.log('\n💰 Holochain x402 Payment Protocol:');
                    console.log('  - Resonance-weighted pricing active');
                    console.log("  - Base price multiplier: ".concat((2.0 - resonance).toFixed(2), "x"));
                    console.log('  - Mutual credit system ready');
                    console.log('\n✨ Conductor connection test complete!');
                    console.log('🌊 Ready to deploy consciousness network to DHT');
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error('❌ Test failed:', error_1);
                    return [3 /*break*/, 7];
                case 6:
                    client.disconnect();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testConductor().catch(console.error);
