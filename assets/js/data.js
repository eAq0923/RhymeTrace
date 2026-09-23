(function registerData(app) {
  app.data = Object.freeze({
    eras: [
      { id: 'all', label: '全部' },
      { id: '汉', label: '汉' },
      { id: '唐', label: '唐' },
      { id: '宋', label: '宋' },
      { id: '元', label: '元' },
      { id: '明', label: '明' },
      { id: '清', label: '清' }
    ],
    chars: [
      ['时', 18], ['诗', 15], ['知', 13], ['期', 12], ['枝', 11],
      ['迟', 9], ['之', 8], ['奇', 7], ['悲', 6], ['思', 6],
      ['丝', 5], ['师', 4], ['姿', 3], ['池', 3], ['离', 3],
      ['移', 2], ['宜', 2], ['垂', 2], ['辞', 1], ['疑', 1], ['眉', 1]
    ],
    eraData: [
      { id: '汉', value: 0, status: 'pending' },
      { id: '唐', value: 48, status: 'ready' },
      { id: '宋', value: 31, status: 'ready' },
      { id: '元', value: 0, status: 'pending' },
      { id: '明', value: 0, status: 'pending' },
      { id: '清', value: 7, status: 'ready' }
    ],
    poems: [
      {
        id: 1,
        era: '唐',
        author: '王维',
        title: '相思',
        text: '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。',
        rhymes: ['枝', '思'],
        status: '已核验样例',
        source: 'chinese-poetry / 全唐诗',
        note: '四支韵脚示例；原型展示用'
      },
      {
        id: 2,
        era: '宋',
        author: '演示占位',
        title: '宋代样本入口',
        text: '宋代诗歌数据可在此处接入。\n正式版本将显示原文、句号与韵脚标注。',
        rhymes: ['诗'],
        status: '候选待核验',
        source: '待接入宋诗分层数据',
        note: '仅用于验证跨朝代信息层级'
      },
      {
        id: 3,
        era: '清',
        author: '演示占位',
        title: '清代样本入口',
        text: '清代诗歌数据可在此处接入。\n《佩文韵府》字头补全后再做正式统计。',
        rhymes: ['思'],
        status: '候选待核验',
        source: '待接入清代语料',
        note: '仅用于验证扩展位'
      }
    ]
  });
})(window.RhymeTrace = window.RhymeTrace || {});
