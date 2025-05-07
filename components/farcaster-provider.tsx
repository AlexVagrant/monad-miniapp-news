"use client";

// 引入 Farcaster Frame 的上下文类型
import { FrameContext } from "@farcaster/frame-core/dist/context";
// 引入 Farcaster Frame SDK
import sdk from "@farcaster/frame-sdk";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
// 引入钱包 Provider 组件
import FrameWalletProvider from "./frame-wallet-provider";

// FrameProvider 提供的上下文类型定义
interface FrameContextValue {
  context: FrameContext | null; // Farcaster 上下文
  isSDKLoaded: boolean; // SDK 是否加载完成
  isEthProviderAvailable: boolean; // 是否有以太坊钱包 Provider
  error: string | null; // 错误信息
  actions: typeof sdk.actions | null; // Farcaster SDK 的 actions
}

// 创建 React Context，用于全局共享 Farcaster 相关状态
export const FrameProviderContext = createContext<FrameContextValue | undefined>(
  undefined
);

// 自定义 Hook，便于在组件中获取 Farcaster 上下文
export function useFrame() {
  const context = useContext(FrameProviderContext);
  if (context === undefined) {
    throw new Error("useFrame must be used within a FrameProvider");
  }
  return context;
}

// FrameProvider 组件 Props 类型
interface FrameProviderProps {
  children: ReactNode;
}

// FrameProvider 组件，负责初始化 Farcaster SDK 并提供全局上下文
export function FrameProvider({ children }: FrameProviderProps) {
  // Farcaster 上下文
  const [context, setContext] = useState<FrameContext | null>(null);
  // Farcaster SDK actions
  const [actions, setActions] = useState<typeof sdk.actions | null>(null);
  // 是否有以太坊钱包 Provider
  const [isEthProviderAvailable, setIsEthProviderAvailable] =
    useState<boolean>(false);
  // SDK 是否加载完成
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  // 错误信息
  const [error, setError] = useState<string | null>(null);

  // 初始化 Farcaster SDK
  useEffect(() => {
    const load = async () => {
      try {
        // 获取 Farcaster 上下文
        const context = await sdk.context;
        if (context) {
          setContext(context as FrameContext);
          setActions(sdk.actions);
          setIsEthProviderAvailable(sdk.wallet.ethProvider ? true : false);
        } else {
          setError("Failed to load Farcaster context");
        }
        // 等待 SDK actions 就绪
        await sdk.actions.ready();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize SDK"
        );
        console.error("SDK initialization error:", err);
      }
    };

    // 只在 SDK 未加载时初始化
    if (sdk && !isSDKLoaded) {
      load().then(() => {
        setIsSDKLoaded(true);
        console.log("SDK loaded");
      });
    }
  }, [isSDKLoaded]);

  // 提供 Farcaster 上下文和钱包 Provider 给子组件
  return (
    <FrameProviderContext.Provider
      value={{
        context,
        actions,
        isSDKLoaded,
        isEthProviderAvailable,
        error,
      }}
    >
      {/* 嵌套钱包 Provider，确保钱包功能可用 */}
      <FrameWalletProvider>{children}</FrameWalletProvider>
    </FrameProviderContext.Provider>
  );
}
