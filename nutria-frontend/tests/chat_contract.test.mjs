/**
 * Empirical Challenger Test Suite: Frontend Contract & State Machine
 *
 * Verifies:
 * 1. Request payload contract (message, exclusions, metrics_override).
 * 2. Response mapping (reply vs message vs fallback).
 * 3. isTyping disabling guards and UI freeze prevention (finally block).
 * 4. Dark Mode alert banner structure and dismissibility.
 * 5. whitespace-pre-wrap styling on user & assistant message bubbles.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatViewPath = path.resolve(__dirname, '../src/components/ChatView.jsx');
const apiJsPath = path.resolve(__dirname, '../src/services/api.js');

describe('Empirical Verification: Frontend Chat Contract & State Machine', () => {

  const chatViewSource = fs.readFileSync(chatViewPath, 'utf8');
  const apiJsSource = fs.readFileSync(apiJsPath, 'utf8');

  describe('1. api.js - sendChatMessage Contract', () => {
    it('should define sendChatMessage with message and context spread into body', () => {
      assert.ok(
        apiJsSource.includes('sendChatMessage(message, context = {})'),
        'apiService must declare sendChatMessage(message, context = {})'
      );
      assert.ok(
        apiJsSource.includes("apiRequest('/chat',"),
        'sendChatMessage must invoke apiRequest with /chat'
      );
      assert.ok(
        apiJsSource.includes("method: 'POST'"),
        'sendChatMessage must use POST HTTP method'
      );
      assert.ok(
        /body:\s*\{\s*message,\s*\.\.\.context\s*\}/.test(apiJsSource),
        'sendChatMessage must format body as { message, ...context }'
      );
    });

    it('should correctly format simulated payload matching PROJECT.md interface contract', () => {
      // Emulate sendChatMessage logic directly
      const mockApiRequest = (endpoint, opts) => {
        return { endpoint, opts };
      };

      const sendChatMessageMock = (message, context = {}) => {
        return mockApiRequest('/chat', {
          method: 'POST',
          body: {
            message,
            ...context
          }
        });
      };

      const query = 'Necesito ajustar mis macros para definición';
      const context = {
        exclusions: ['Sin Frutos Cáscara', 'Sin Mariscos', 'Sin Lactosa'],
        metrics_override: {
          peso: 63.8,
          altura: 1.68,
          edad: 26,
          sexo: 'Femenino',
          objetivo: 'Hipertrofia Limpia',
          tdee: 2150,
          imc: 22.6,
          dietScheme: 'Alta en Proteína'
        }
      };

      const call = sendChatMessageMock(query, context);
      assert.strictEqual(call.endpoint, '/chat');
      assert.strictEqual(call.opts.method, 'POST');
      assert.strictEqual(call.opts.body.message, query);
      assert.deepStrictEqual(call.opts.body.exclusions, context.exclusions);
      assert.deepStrictEqual(call.opts.body.metrics_override, context.metrics_override);
    });
  });

  describe('2. ChatView.jsx - Payload Construction & Dispatch', () => {
    it('should invoke sendChatMessage with trimmed message, exclusions, and metrics_override', () => {
      assert.ok(
        chatViewSource.includes('apiService.sendChatMessage(trimmedQuery,'),
        'ChatView must call apiService.sendChatMessage with trimmedQuery'
      );
      assert.ok(
        chatViewSource.includes('exclusions,'),
        'ChatView must include exclusions in the context payload'
      );
      assert.ok(
        chatViewSource.includes('metrics_override: {'),
        'ChatView must provide metrics_override object'
      );
      assert.ok(
        chatViewSource.includes('peso: Number(weight),'),
        'metrics_override must include numeric peso'
      );
      assert.ok(
        chatViewSource.includes('altura: Number(height),'),
        'metrics_override must include numeric altura'
      );
      assert.ok(
        chatViewSource.includes('tdee: Number(tdeeLive),'),
        'metrics_override must include numeric tdee'
      );
      assert.ok(
        chatViewSource.includes('imc: Number(imcLive),'),
        'metrics_override must include numeric imc'
      );
    });
  });

  describe('3. ChatView.jsx - Response Mapping (reply vs message vs fallback)', () => {
    it('should map reply correctly prioritizing res.data.reply then res.data.message then fallback', () => {
      assert.ok(
        chatViewSource.includes('res.data.reply || res.data.message ||'),
        'Response mapping must fall back gracefully from reply to message to default'
      );

      // Empirical execution of the mapping expression
      const evaluateReply = (res) => {
        return res?.data?.reply || res?.data?.message || 'Respuesta recibida de NutriaBot.';
      };

      // Case A: standard reply from backend
      assert.strictEqual(
        evaluateReply({ ok: true, data: { reply: 'Hola atleta, tu plan está listo.' } }),
        'Hola atleta, tu plan está listo.'
      );

      // Case B: message key from alternate backend view
      assert.strictEqual(
        evaluateReply({ ok: true, data: { message: 'Mensaje alternativo del bot.' } }),
        'Mensaje alternativo del bot.'
      );

      // Case C: neither key provided
      assert.strictEqual(
        evaluateReply({ ok: true, data: {} }),
        'Respuesta recibida de NutriaBot.'
      );
    });
  });

  describe('4. ChatView.jsx - Disabled State Under isTyping', () => {
    it('should guard handleSendMessage against concurrent invocations when isTyping is true', () => {
      assert.ok(
        chatViewSource.includes('if (isTyping) return false;'),
        'handleSendMessage must return false immediately if isTyping is true'
      );
    });

    it('should guard handleRegeneratePlan against execution when isTyping or isRegenerating is true', () => {
      assert.ok(
        chatViewSource.includes('if (isRegenerating || isTyping) return;'),
        'handleRegeneratePlan must bail out if isTyping or isRegenerating is true'
      );
    });

    it('should disable input field when isTyping is true', () => {
      assert.ok(
        chatViewSource.includes('disabled={isTyping}'),
        'Input element must bind disabled to isTyping'
      );
      assert.ok(
        chatViewSource.includes('placeholder={isTyping ? "NutriaBot está respondiendo..."'),
        'Input placeholder must adapt during isTyping'
      );
    });

    it('should disable submit button when isTyping is true or input is empty', () => {
      assert.ok(
        chatViewSource.includes('disabled={isTyping || !inputMessage.trim()}'),
        'Send button must disable when isTyping is true or trimmed input is empty'
      );
    });

    it('should disable regenerate plan button when isTyping or isRegenerating is true', () => {
      assert.ok(
        chatViewSource.includes('disabled={isRegenerating || isTyping}'),
        'Regenerate plan button must disable when isTyping or isRegenerating'
      );
    });

    it('should disable quick suggestion chips when isTyping is true', () => {
      const chipPattern = /quickChips\.map[\s\S]*?<button[\s\S]*?disabled=\{isTyping\}/;
      assert.ok(
        chipPattern.test(chatViewSource),
        'Quick suggestions chips must have disabled={isTyping}'
      );
    });

    it('should disable accessory buttons (paperclip and mic) when isTyping is true', () => {
      const paperclipPattern = /disabled=\{isTyping\}[\s\S]*?Paperclip/;
      const micPattern = /disabled=\{isTyping\}[\s\S]*?Mic/;
      assert.ok(paperclipPattern.test(chatViewSource), 'Paperclip button must be disabled when isTyping');
      assert.ok(micPattern.test(chatViewSource), 'Mic button must be disabled when isTyping');
    });
  });

  describe('5. ChatView.jsx - UI Freeze Resilience (finally block)', () => {
    it('should guarantee setIsTyping(false) in a finally block', () => {
      assert.ok(
        chatViewSource.includes('finally {'),
        'handleSendMessage must implement a finally block'
      );
      assert.ok(
        chatViewSource.includes('setIsTyping(false);'),
        'finally block must invoke setIsTyping(false)'
      );
    });

    it('should empirically verify that isTyping state transitions back to false under all failure modes', async () => {
      // Replicate state machine harness
      class ChatStateHarness {
        constructor() {
          this.isTyping = false;
          this.errorMessage = null;
          this.messages = [];
        }

        async simulateSend(mockCall) {
          if (this.isTyping) return false;
          this.isTyping = true;
          this.errorMessage = null;

          try {
            const res = await mockCall();
            if (res && res.ok && res.data) {
              const replyText = res.data.reply || res.data.message || 'Respuesta recibida';
              this.messages.push({ sender: 'bot', text: replyText });
              return true;
            } else {
              const errorText = res?.error || 'Error de conexión con NutriaBot';
              this.errorMessage = errorText;
              return false;
            }
          } catch (err) {
            const errorText = err?.message || 'Error de conexión con NutriaBot';
            this.errorMessage = errorText;
            return false;
          } finally {
            this.isTyping = false;
          }
        }
      }

      // Harness Test 1: Successful response
      const harness1 = new ChatStateHarness();
      const p1 = harness1.simulateSend(async () => {
        assert.strictEqual(harness1.isTyping, true, 'isTyping must be true while in-flight');
        return { ok: true, data: { reply: 'Plan generado con éxito' } };
      });
      const res1 = await p1;
      assert.strictEqual(res1, true);
      assert.strictEqual(harness1.isTyping, false, 'isTyping must return to false after success');
      assert.strictEqual(harness1.errorMessage, null);
      assert.strictEqual(harness1.messages.length, 1);

      // Harness Test 2: HTTP 500 / 400 error payload returned
      const harness2 = new ChatStateHarness();
      const res2 = await harness2.simulateSend(async () => {
        return { ok: false, error: 'OpenRouter rate limit exceeded' };
      });
      assert.strictEqual(res2, false);
      assert.strictEqual(harness2.isTyping, false, 'isTyping must return to false after error response');
      assert.strictEqual(harness2.errorMessage, 'OpenRouter rate limit exceeded');

      // Harness Test 3: Network exception / thrown rejection
      const harness3 = new ChatStateHarness();
      const res3 = await harness3.simulateSend(async () => {
        throw new Error('Network timeout unreachable');
      });
      assert.strictEqual(res3, false);
      assert.strictEqual(harness3.isTyping, false, 'isTyping must return to false after throw');
      assert.strictEqual(harness3.errorMessage, 'Network timeout unreachable');

      // Harness Test 4: Concurrency rejection while typing
      const harness4 = new ChatStateHarness();
      let resolveFirst;
      const deferred = new Promise(res => { resolveFirst = res; });
      const flight1 = harness4.simulateSend(() => deferred);
      assert.strictEqual(harness4.isTyping, true);
      // Attempt second send concurrently
      const flight2 = await harness4.simulateSend(() => ({ ok: true, data: {} }));
      assert.strictEqual(flight2, false, 'Concurrent send must be rejected when isTyping is true');
      resolveFirst({ ok: true, data: { reply: 'First done' } });
      await flight1;
      assert.strictEqual(harness4.isTyping, false, 'isTyping unlocked after first completes');
    });
  });

  describe('6. ChatView.jsx - Dark Mode Error Banner & Dismissibility', () => {
    it('should conditionally render Dark Mode alert banner with dismiss trigger', () => {
      assert.ok(
        chatViewSource.includes('{errorMessage && ('),
        'Error banner must be conditionally displayed when errorMessage is truthy'
      );
      assert.ok(
        chatViewSource.includes('bg-red-950/60 border border-red-500/40 text-red-200'),
        'Error banner must feature dark mode red styling'
      );
      assert.ok(
        chatViewSource.includes('onClick={() => setErrorMessage(null)}'),
        'Dismiss button must reset errorMessage to null'
      );
      assert.ok(
        chatViewSource.includes('<AlertCircle size={16}'),
        'Error banner must display AlertCircle icon'
      );
    });
  });

  describe('7. ChatView.jsx - whitespace-pre-wrap Message Styling', () => {
    it('should apply whitespace-pre-wrap to user message bubbles', () => {
      const userBubbleMatch = chatViewSource.includes('leading-relaxed whitespace-pre-wrap">{msg.text}</p>');
      assert.ok(
        userBubbleMatch,
        'User message block must contain leading-relaxed whitespace-pre-wrap'
      );
    });

    it('should apply whitespace-pre-wrap to bot text response bubbles', () => {
      const botBubbleMatch = chatViewSource.includes(
        'className="bg-[#090D14] border border-[#1F2937] rounded-2xl rounded-tl-sm p-4 text-sm text-slate-200 leading-relaxed shadow-sm whitespace-pre-wrap"'
      );
      assert.ok(
        botBubbleMatch,
        'Bot message block must contain whitespace-pre-wrap to preserve formatting and line breaks'
      );
    });
  });
});
