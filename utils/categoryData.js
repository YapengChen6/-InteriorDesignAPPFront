

// 完整的分类数据（根据您提供的原始数据）
export const categoryData = [
  // 一级分类
  { id: 0, name: '建材主材', parent_id: 0, level: 1, sort_order: 100 },
  { id: 1, name: '装修辅料', parent_id: 0, level: 1, sort_order: 90 },
  { id: 2, name: '家具软装', parent_id: 0, level: 1, sort_order: 80 },
  { id: 3, name: '厨卫洁具', parent_id: 0, level: 1, sort_order: 70 },
  { id: 4, name: '灯具照明', parent_id: 0, level: 1, sort_order: 60 },
  { id: 5, name: '家居电器', parent_id: 0, level: 1, sort_order: 50 },
  { id: 6, name: '五金工具', parent_id: 0, level: 1, sort_order: 40 },
  { id: 7, name: '地板门窗', parent_id: 0, level: 1, sort_order: 30 },
  { id: 8, name: '其他分类', parent_id: 0, level: 1, sort_order: 10 },

  // 建材主材 -> 二级分类
  { id: 10, name: '墙面材料', parent_id: 0, level: 2, sort_order: 100 },
  { id: 11, name: '地面材料', parent_id: 0, level: 2, sort_order: 90 },
  { id: 12, name: '吊顶材料', parent_id: 0, level: 2, sort_order: 80 },
  { id: 13, name: '石材瓷砖', parent_id: 0, level: 2, sort_order: 70 },
  { id: 14, name: '板材木材', parent_id: 0, level: 2, sort_order: 60 },
  { id: 15, name: '其他建材', parent_id: 0, level: 2, sort_order: 10 },

  // 装修辅料 -> 二级分类
  { id: 16, name: '涂料油漆', parent_id: 1, level: 2, sort_order: 100 },
  { id: 17, name: '胶粘密封', parent_id: 1, level: 2, sort_order: 90 },
  { id: 18, name: '水电材料', parent_id: 1, level: 2, sort_order: 80 },
  { id: 19, name: '防水材料', parent_id: 1, level: 2, sort_order: 70 },
  { id: 20, name: '隔音保温', parent_id: 1, level: 2, sort_order: 60 },
  { id: 21, name: '其他辅料', parent_id: 1, level: 2, sort_order: 10 },

  // 家具软装 -> 二级分类
  { id: 22, name: '客厅家具', parent_id: 2, level: 2, sort_order: 100 },
  { id: 23, name: '卧室家具', parent_id: 2, level: 2, sort_order: 90 },
  { id: 24, name: '餐厅家具', parent_id: 2, level: 2, sort_order: 80 },
  { id: 25, name: '办公家具', parent_id: 2, level: 2, sort_order: 70 },
  { id: 26, name: '软装饰品', parent_id: 2, level: 2, sort_order: 60 },
  { id: 27, name: '其他家具', parent_id: 2, level: 2, sort_order: 10 },

  // 厨卫洁具 -> 二级分类
  { id: 28, name: '厨房设备', parent_id: 3, level: 2, sort_order: 100 },
  { id: 29, name: '卫浴洁具', parent_id: 3, level: 2, sort_order: 90 },
  { id: 30, name: '厨卫五金', parent_id: 3, level: 2, sort_order: 80 },
  { id: 31, name: '水槽龙头', parent_id: 3, level: 2, sort_order: 70 },
  { id: 32, name: '其他厨卫', parent_id: 3, level: 2, sort_order: 10 },

  // 灯具照明 -> 二级分类
  { id: 33, name: '室内照明', parent_id: 4, level: 2, sort_order: 100 },
  { id: 34, name: '户外照明', parent_id: 4, level: 2, sort_order: 90 },
  { id: 35, name: '商业照明', parent_id: 4, level: 2, sort_order: 80 },
  { id: 36, name: '智能照明', parent_id: 4, level: 2, sort_order: 70 },
  { id: 37, name: '其他灯具', parent_id: 4, level: 2, sort_order: 10 },

  // 家居电器 -> 二级分类
  { id: 38, name: '厨房电器', parent_id: 5, level: 2, sort_order: 100 },
  { id: 39, name: '卫浴电器', parent_id: 5, level: 2, sort_order: 90 },
  { id: 40, name: '环境电器', parent_id: 5, level: 2, sort_order: 80 },
  { id: 41, name: '智能家居', parent_id: 5, level: 2, sort_order: 70 },
  { id: 42, name: '其他电器', parent_id: 5, level: 2, sort_order: 10 },

  // 五金工具 -> 二级分类
  { id: 43, name: '手动工具', parent_id: 6, level: 2, sort_order: 100 },
  { id: 44, name: '电动工具', parent_id: 6, level: 2, sort_order: 90 },
  { id: 45, name: '紧固件', parent_id: 6, level: 2, sort_order: 80 },
  { id: 46, name: '管件阀门', parent_id: 6, level: 2, sort_order: 70 },
  { id: 47, name: '其他五金', parent_id: 6, level: 2, sort_order: 10 },

  // 地板门窗 -> 二级分类
  { id: 48, name: '室内门', parent_id: 7, level: 2, sort_order: 100 },
  { id: 49, name: '窗户', parent_id: 7, level: 2, sort_order: 90 },
  { id: 50, name: '地板', parent_id: 7, level: 2, sort_order: 80 },
  { id: 51, name: '楼梯', parent_id: 7, level: 2, sort_order: 70 },
  { id: 52, name: '其他门窗', parent_id: 7, level: 2, sort_order: 10 },

  // 其他分类 -> 二级分类
  { id: 53, name: '特殊材料', parent_id: 8, level: 2, sort_order: 100 },
  { id: 54, name: '定制商品', parent_id: 8, level: 2, sort_order: 90 },
  { id: 55, name: '二手建材', parent_id: 8, level: 2, sort_order: 80 },
  { id: 56, name: '租赁服务', parent_id: 8, level: 2, sort_order: 70 },
  { id: 57, name: '其他商品', parent_id: 8, level: 2, sort_order: 10 },

  // 三级分类 - 墙面材料
  { id: 100, name: '乳胶漆', parent_id: 10, level: 3, sort_order: 100 },
  { id: 101, name: '壁纸壁布', parent_id: 10, level: 3, sort_order: 90 },
  { id: 102, name: '硅藻泥', parent_id: 10, level: 3, sort_order: 80 },
  { id: 103, name: '艺术涂料', parent_id: 10, level: 3, sort_order: 70 },
  { id: 104, name: '墙板', parent_id: 10, level: 3, sort_order: 60 },
  { id: 105, name: '护墙板', parent_id: 10, level: 3, sort_order: 50 },
  { id: 106, name: '踢脚线', parent_id: 10, level: 3, sort_order: 40 },
  { id: 107, name: '背景墙', parent_id: 10, level: 3, sort_order: 30 },
  { id: 108, name: '其他墙面材料', parent_id: 10, level: 3, sort_order: 10 },

  // 三级分类 - 地面材料
  { id: 109, name: '实木地板', parent_id: 11, level: 3, sort_order: 100 },
  { id: 110, name: '复合地板', parent_id: 11, level: 3, sort_order: 90 },
  { id: 111, name: '强化地板', parent_id: 11, level: 3, sort_order: 80 },
  { id: 112, name: '竹地板', parent_id: 11, level: 3, sort_order: 70 },
  { id: 113, name: '软木地板', parent_id: 11, level: 3, sort_order: 60 },
  { id: 114, name: '地毯', parent_id: 11, level: 3, sort_order: 50 },
  { id: 115, name: '地板革', parent_id: 11, level: 3, sort_order: 40 },
  { id: 116, name: '其他地面材料', parent_id: 11, level: 3, sort_order: 10 },

  // 三级分类 - 吊顶材料
  { id: 117, name: '石膏板', parent_id: 12, level: 3, sort_order: 100 },
  { id: 118, name: '铝扣板', parent_id: 12, level: 3, sort_order: 90 },
  { id: 119, name: '集成吊顶', parent_id: 12, level: 3, sort_order: 80 },
  { id: 120, name: 'PVC吊顶', parent_id: 12, level: 3, sort_order: 70 },
  { id: 121, name: '矿棉板', parent_id: 12, level: 3, sort_order: 60 },
  { id: 122, name: '格栅吊顶', parent_id: 12, level: 3, sort_order: 50 },
  { id: 123, name: '其他吊顶材料', parent_id: 12, level: 3, sort_order: 10 },

  // 三级分类 - 石材瓷砖
  { id: 124, name: '大理石', parent_id: 13, level: 3, sort_order: 100 },
  { id: 125, name: '花岗岩', parent_id: 13, level: 3, sort_order: 90 },
  { id: 126, name: '人造石', parent_id: 13, level: 3, sort_order: 80 },
  { id: 127, name: '瓷砖', parent_id: 13, level: 3, sort_order: 70 },
  { id: 128, name: '马赛克', parent_id: 13, level: 3, sort_order: 60 },
  { id: 129, name: '文化石', parent_id: 13, level: 3, sort_order: 50 },
  { id: 130, name: '其他石材瓷砖', parent_id: 13, level: 3, sort_order: 10 },

  // 三级分类 - 板材木材
  { id: 131, name: '细木工板', parent_id: 14, level: 3, sort_order: 100 },
  { id: 132, name: '密度板', parent_id: 14, level: 3, sort_order: 90 },
  { id: 133, name: '刨花板', parent_id: 14, level: 3, sort_order: 80 },
  { id: 134, name: '胶合板', parent_id: 14, level: 3, sort_order: 70 },
  { id: 135, name: '欧松板', parent_id: 14, level: 3, sort_order: 60 },
  { id: 136, name: '实木板', parent_id: 14, level: 3, sort_order: 50 },
  { id: 137, name: '其他板材木材', parent_id: 14, level: 3, sort_order: 10 },

  // 三级分类 - 涂料油漆
  { id: 138, name: '内墙乳胶漆', parent_id: 16, level: 3, sort_order: 100 },
  { id: 139, name: '外墙乳胶漆', parent_id: 16, level: 3, sort_order: 90 },
  { id: 140, name: '木器漆', parent_id: 16, level: 3, sort_order: 80 },
  { id: 141, name: '金属漆', parent_id: 16, level: 3, sort_order: 70 },
  { id: 142, name: '防水涂料', parent_id: 16, level: 3, sort_order: 60 },
  { id: 143, name: '防火涂料', parent_id: 16, level: 3, sort_order: 50 },
  { id: 144, name: '其他涂料油漆', parent_id: 16, level: 3, sort_order: 10 },

  // 三级分类 - 胶粘密封
  { id: 145, name: '玻璃胶', parent_id: 17, level: 3, sort_order: 100 },
  { id: 146, name: '结构胶', parent_id: 17, level: 3, sort_order: 90 },
  { id: 147, name: '发泡胶', parent_id: 17, level: 3, sort_order: 80 },
  { id: 148, name: '瓷砖胶', parent_id: 17, level: 3, sort_order: 70 },
  { id: 149, name: '密封胶', parent_id: 17, level: 3, sort_order: 60 },
  { id: 150, name: '其他胶粘材料', parent_id: 17, level: 3, sort_order: 10 },

  // 三级分类 - 水电材料
  { id: 151, name: 'PVC电线管', parent_id: 18, level: 3, sort_order: 100 },
  { id: 152, name: 'PPR水管', parent_id: 18, level: 3, sort_order: 90 },
  { id: 153, name: '电线电缆', parent_id: 18, level: 3, sort_order: 80 },
  { id: 154, name: '开关插座', parent_id: 18, level: 3, sort_order: 70 },
  { id: 155, name: '配电箱', parent_id: 18, level: 3, sort_order: 60 },
  { id: 156, name: '其他水电材料', parent_id: 18, level: 3, sort_order: 10 },

  // 三级分类 - 客厅家具
  { id: 157, name: '沙发', parent_id: 22, level: 3, sort_order: 100 },
  { id: 158, name: '茶几', parent_id: 22, level: 3, sort_order: 90 },
  { id: 159, name: '电视柜', parent_id: 22, level: 3, sort_order: 80 },
  { id: 160, name: '鞋柜', parent_id: 22, level: 3, sort_order: 70 },
  { id: 161, name: '展示柜', parent_id: 22, level: 3, sort_order: 60 },
  { id: 162, name: '其他客厅家具', parent_id: 22, level: 3, sort_order: 10 },

  // 三级分类 - 卧室家具
  { id: 163, name: '床', parent_id: 23, level: 3, sort_order: 100 },
  { id: 164, name: '衣柜', parent_id: 23, level: 3, sort_order: 90 },
  { id: 165, name: '床头柜', parent_id: 23, level: 3, sort_order: 80 },
  { id: 166, name: '梳妆台', parent_id: 23, level: 3, sort_order: 70 },
  { id: 167, name: '其他卧室家具', parent_id: 23, level: 3, sort_order: 10 },

  // 三级分类 - 厨房设备
  { id: 168, name: '橱柜', parent_id: 28, level: 3, sort_order: 100 },
  { id: 169, name: '灶具', parent_id: 28, level: 3, sort_order: 90 },
  { id: 170, name: '油烟机', parent_id: 28, level: 3, sort_order: 80 },
  { id: 171, name: '水槽', parent_id: 28, level: 3, sort_order: 70 },
  { id: 172, name: '其他厨房设备', parent_id: 28, level: 3, sort_order: 10 },

  // 三级分类 - 卫浴洁具
  { id: 173, name: '马桶', parent_id: 29, level: 3, sort_order: 100 },
  { id: 174, name: '浴室柜', parent_id: 29, level: 3, sort_order: 90 },
  { id: 175, name: '淋浴房', parent_id: 29, level: 3, sort_order: 80 },
  { id: 176, name: '浴缸', parent_id: 29, level: 3, sort_order: 70 },
  { id: 177, name: '其他卫浴洁具', parent_id: 29, level: 3, sort_order: 10 },

  // 三级分类 - 室内照明
  { id: 178, name: '吊灯', parent_id: 33, level: 3, sort_order: 100 },
  { id: 179, name: '吸顶灯', parent_id: 33, level: 3, sort_order: 90 },
  { id: 180, name: '筒灯', parent_id: 33, level: 3, sort_order: 80 },
  { id: 181, name: '射灯', parent_id: 33, level: 3, sort_order: 70 },
  { id: 182, name: '其他室内灯具', parent_id: 33, level: 3, sort_order: 10 },

  // 三级分类 - 厨房电器
  { id: 183, name: '冰箱', parent_id: 38, level: 3, sort_order: 100 },
  { id: 184, name: '微波炉', parent_id: 38, level: 3, sort_order: 90 },
  { id: 185, name: '洗碗机', parent_id: 38, level: 3, sort_order: 80 },
  { id: 186, name: '烤箱', parent_id: 38, level: 3, sort_order: 70 },
  { id: 187, name: '其他厨房电器', parent_id: 38, level: 3, sort_order: 10 },

  // 三级分类 - 手动工具
  { id: 188, name: '扳手', parent_id: 43, level: 3, sort_order: 100 },
  { id: 189, name: '螺丝刀', parent_id: 43, level: 3, sort_order: 90 },
  { id: 190, name: '钳子', parent_id: 43, level: 3, sort_order: 80 },
  { id: 191, name: '锤子', parent_id: 43, level: 3, sort_order: 70 },
  { id: 192, name: '其他手动工具', parent_id: 43, level: 3, sort_order: 10 },

  // 三级分类 - 室内门
  { id: 193, name: '实木门', parent_id: 48, level: 3, sort_order: 100 },
  { id: 194, name: '复合门', parent_id: 48, level: 3, sort_order: 90 },
  { id: 195, name: '玻璃门', parent_id: 48, level: 3, sort_order: 80 },
  { id: 196, name: '推拉门', parent_id: 48, level: 3, sort_order: 70 },
  { id: 197, name: '其他室内门', parent_id: 48, level: 3, sort_order: 10 },

  // 三级分类 - 特殊材料
  { id: 198, name: '防火材料', parent_id: 53, level: 3, sort_order: 90 },
  { id: 199, name: '隔音材料', parent_id: 53, level: 3, sort_order: 80 },
  { id: 200, name: '防水材料', parent_id: 53, level: 3, sort_order: 70 },
  { id: 201, name: '环保材料', parent_id: 53, level: 3, sort_order: 100 },
  { id: 202, name: '其他特殊材料', parent_id: 53, level: 3, sort_order: 10 }
]

// 获取分类树的函数
export const getCategoryTree = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: 'success',
        data: categoryData
      })
    }, 500)
  })
}

export default categoryData