/**
 * Polyfills required by the Vercel AI SDK on React Native (Hermes).
 * See https://ai-sdk.dev/docs/getting-started/expo#polyfills
 * Imported once from the root layout.
 */
import { Platform } from "react-native";
import structuredClone from "@ungap/structured-clone";

if (Platform.OS !== "web") {
  const setupPolyfills = async () => {
    const { polyfillGlobal } = await import(
      // Internal RN module without public type declarations
      // @ts-expect-error — no published typings for this path
      "react-native/Libraries/Utilities/PolyfillFunctions"
    );
    const { TextEncoderStream, TextDecoderStream } =
      await import("@stardazed/streams-text-encoding");
    if (!("structuredClone" in global)) {
      polyfillGlobal("structuredClone", () => structuredClone);
    }
    polyfillGlobal("TextEncoderStream", () => TextEncoderStream);
    polyfillGlobal("TextDecoderStream", () => TextDecoderStream);
  };
  setupPolyfills();
}

export {};
