const fs = require('fs');
let content = fs.readFileSync('/app/applet/server.ts', 'utf8');

const target = `    } catch (error: any) {
      console.error("AI Consultant Error:", error);
      let errorMessage = error.message;
      if (errorMessage && (errorMessage.includes("429") || errorMessage.includes("Quota exceeded") || errorMessage.includes("RESOURCE_EXHAUSTED"))) {
        errorMessage = "The AI Consultant is currently experiencing high demand and has reached its rate limit. Please wait a minute and try again.";
      }`;

const replacement = `    } catch (error: any) {
      console.error("AI Consultant Error:", error);
      let errorMessage = error.message;
      if (errorMessage && (errorMessage.includes("429") || errorMessage.includes("Quota exceeded") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE"))) {
        errorMessage = "The AI Consultant is currently experiencing high demand. Spikes in demand are usually temporary. Please wait a few seconds and try again.";
      }`;

content = content.replace(target, replacement);
fs.writeFileSync('/app/applet/server.ts', content);
