export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/plan/index',
    'pages/dorm/index',
    'pages/focus/index',
    'pages/report/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0F172A',
    navigationBarTitleText: '睡眠小助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0F172A'
  },
  tabBar: {
    color: '#64748B',
    selectedColor: '#5B6DF0',
    backgroundColor: '#1E293B',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/plan/index',
        text: '睡眠计划'
      },
      {
        pagePath: 'pages/dorm/index',
        text: '宿舍协同'
      },
      {
        pagePath: 'pages/focus/index',
        text: '专注训练'
      },
      {
        pagePath: 'pages/report/index',
        text: '周报'
      }
    ]
  }
})
