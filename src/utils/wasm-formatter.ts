// WASM格式化器接口
interface WasmFormatResult {
  success: boolean;
  formatted: string;
  error?: string;
}

interface WasmValidateResult {
  valid: boolean;
  error?: string;
}

interface WasmExplainResult {
  success: boolean;
  ast?: any;
  execution?: any[];
  performance?: any;
  error?: string;
}

// 全局WASM函数声明
declare global {
  interface Window {
    formatPromQLWasm?: (query: string) => WasmFormatResult;
    validatePromQLWasm?: (query: string) => WasmValidateResult;
    explainPromQLWasm?: (query: string) => WasmExplainResult;
    getExampleQueriesWasm?: () => string[];
    wasmReady?: () => void;
    Go?: any;
  }
}

class WasmFormatter {
  private isReady = false;
  private readyPromise: Promise<void>;
  private go: any;

  constructor() {
    this.readyPromise = this.initWasm();
  }

  private async initWasm(): Promise<void> {
    try {
      // 获取base URL
      const baseUrl = import.meta.env.BASE_URL || '/';
      
      // 加载wasm_exec.js
      await this.loadScript(`${baseUrl}wasm_exec.js`);
      
      // 创建Go实例
      this.go = new window.Go!();
      
      // 设置WASM准备就绪回调
      window.wasmReady = () => {
        this.isReady = true;
        console.log('🚀 WASM PromQL formatter is ready!');
      };
      
      // 加载并实例化WASM模块
      const result = await WebAssembly.instantiateStreaming(
        fetch(`${baseUrl}promql-formatter.wasm`),
        this.go.importObject
      );
      
      // 运行WASM模块
      this.go.run(result.instance);
      
      // 等待WASM准备就绪
      await this.waitForReady();
      
    } catch (error) {
      console.error('Failed to initialize WASM formatter:', error);
      throw error;
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  private waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.isReady) {
          resolve();
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    });
  }

  /**
   * 等待WASM模块准备就绪
   */
  async waitForInit(): Promise<void> {
    await this.readyPromise;
  }

  /**
   * 检查WASM是否可用
   */
  isAvailable(): boolean {
    return this.isReady && 
           typeof window.formatPromQLWasm === 'function' &&
           typeof window.validatePromQLWasm === 'function' &&
           typeof window.explainPromQLWasm === 'function';
  }

  /**
   * 使用WASM格式化PromQL查询
   */
  async formatPromQL(query: string): Promise<{ success: boolean; formatted: string; error?: string }> {
    await this.waitForInit();
    
    if (!this.isAvailable()) {
      throw new Error('WASM formatter is not available');
    }
    
    try {
      const result = window.formatPromQLWasm!(query);
      return result;
    } catch (error) {
      console.error('WASM formatting error:', error);
      return {
        success: false,
        formatted: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 使用WASM验证PromQL查询
   */
  async validatePromQL(query: string): Promise<{ valid: boolean; error?: string }> {
    await this.waitForInit();
    
    if (!this.isAvailable()) {
      throw new Error('WASM validator is not available');
    }
    
    try {
      const result = window.validatePromQLWasm!(query);
      return result;
    } catch (error) {
      console.error('WASM validation error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 使用WASM解释PromQL查询
   */
  async explainPromQL(query: string): Promise<WasmExplainResult> {
    await this.waitForInit();
    
    if (!this.isAvailable()) {
      throw new Error('WASM formatter is not available');
    }
    
    try {
      const result = window.explainPromQLWasm!(query);
      return result;
    } catch (error) {
      console.error('WASM explain error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取示例查询
   */
  async getExampleQueries(): Promise<string[]> {
    await this.waitForInit();
    
    if (!this.isAvailable()) {
      throw new Error('WASM formatter is not available');
    }
    
    try {
      const result = window.getExampleQueriesWasm!();
      return result;
    } catch (error) {
      console.error('WASM get examples error:', error);
      return [];
    }
  }
}

export default WasmFormatter;
export type { WasmFormatResult, WasmValidateResult, WasmExplainResult };