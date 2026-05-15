module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  // 关闭 preflight：避免 tailwind 的全局重置（img max-width:100% 等）干扰 react-native-web 渲染。
  // 此配置仅影响 web 端通过 tailwindcss CLI 生成的 CSS；nativewind 在原生端自己解析 className，不读这里。
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F7',
          100: '#FFE3E8',
          200: '#FFC7D1',
          300: '#FFA0AF',
          400: '#FF7A8E',
          500: '#FF546D',
          600: '#E63A53',
        },
      },
    },
  },
  plugins: [],
}
