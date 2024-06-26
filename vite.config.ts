import legacy from "@vitejs/plugin-legacy"
import vue from "@vitejs/plugin-vue"
import { codeInspectorPlugin } from "code-inspector-plugin"
import { resolve } from "path"
import { visualizer } from "rollup-plugin-visualizer"
import AutoImport from "unplugin-auto-import/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import Components from "unplugin-vue-components/vite"
import { type ConfigEnv, type UserConfigExport, loadEnv } from "vite"
import envCompatible from "vite-plugin-env-compatible"
import { viteMockServe } from "vite-plugin-mock"
import { createStyleImportPlugin, ElementPlusResolve } from "vite-plugin-style-import"
import stylelintPlugin from "vite-plugin-stylelint"

export default ({ command, mode }: ConfigEnv): UserConfigExport => {
  const viteEnv = loadEnv(mode, process.cwd(), "") as ImportMetaEnv
  const { VITE_PUBLIC_PATH } = viteEnv
  const prodMock = true

  const plugins = [
    envCompatible({ prefix: "VITE_" }), // 兼容process.env获取环境变量
    vue(),
    stylelintPlugin({
      include: ["src/**/*.{vue,css,scss,less}"]
    }),
    legacy({
      targets: ["> 1%", "last 2 versions", "not dead", "not IE 11"]
    }),
    viteMockServe({
      ignore: /^_/,
      mockPath: "./mock/",
      supportTs: true,
      watchFiles: true,
      localEnabled: command === "serve",
      prodEnabled: command !== "serve" && prodMock,
      logger: false,
      injectCode: `import { setupProdMockServer } from '../mock/_createProductionServer.js';
      setupProdMockServer();`
    }),
    createStyleImportPlugin({
      resolves: [ElementPlusResolve()]
    }),
    visualizer({
      gzipSize: true,
      brotliSize: true,
      emitFile: false,
      filename: "test.html", //分析图生成的文件名
      open: true //如果存在本地服务端口，将在打包后自动展示
    }),
    codeInspectorPlugin({
      bundler: "vite"
    })
  ]

  if (mode === "production") {
    plugins.push(
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        resolvers: [ElementPlusResolver()],
        dts: resolve(__dirname, "types/auto-imports.d.ts") //生成的类型声明文件,
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: resolve(__dirname, "types/components.d.ts") // 生成的类型声明文件
      })
    )
  }

  return {
    /** 打包时根据实际情况修改 base */
    base: VITE_PUBLIC_PATH,
    resolve: {
      alias: {
        /** @ 符号指向 src 目录 */
        "@": resolve(__dirname, "./src")
      }
    },
    build: {
      /** 单个 chunk 文件的大小超过 2048KB 时发出警告 */
      chunkSizeWarningLimit: 2048,
      /** 禁用 gzip 压缩大小报告 */
      reportCompressedSize: false,
      /** 打包后静态资源目录 */
      assetsDir: "static",
      rollupOptions: {
        output: {
          /**
           * 分块策略
           * 1. 注意这些包名必须存在，否则打包会报错
           * 2. 如果你不想自定义 chunk 分割策略，可以直接移除这段配置
           */
          manualChunks: {
            vue: ["vue", "vue-router", "pinia"],
            element: ["element-plus", "@element-plus/icons-vue"]
          }
        }
      }
    },
    /** 混淆器 */
    esbuild:
      mode === "development"
        ? undefined
        : {
            /** 打包时移除 console.log */
            pure: ["console.log"],
            /** 打包时移除 debugger */
            drop: ["debugger"],
            /** 打包时移除所有注释 */
            legalComments: "none"
          },
    server: {
      /** 设置 host: true 才可以使用 Network 的形式，以 IP 访问项目 */
      host: true, // host: "0.0.0.0"
      /** 端口号 */
      port: 3333,
      /** 是否自动打开浏览器 */
      open: false,
      /** 跨域设置允许 */
      cors: true,
      /** 端口被占用时，是否直接退出 */
      strictPort: false,
      /** 接口代理 */
      proxy: {
        "/api/v1": {
          target: "http://localhost:3099/",
          ws: true,
          /** 是否允许跨域 */
          changeOrigin: true
        }
      },
      hmr: {
        overlay: false // 禁用 HMR 错误覆盖层
      },
      /** 预热常用文件，提高初始页面加载速度 */
      warmup: {
        clientFiles: ["./src/layouts/**/*.vue"]
      }
    },
    /** Vite 插件 */
    plugins,
    css: {
      preprocessorOptions: {
        less: {
          // 这里可以放置全局的 less 变量、mixin 等
          additionalData: `@import "@/styles/variables.less";`,
          javascriptEnabled: true
        },
        scss: {
          // 这里可以放置全局的 scss 变量、mixin 等
          additionalData: `@import "@/styles/variables.scss";`,
          javascriptEnabled: true
        }
      }
    }
  }
}
