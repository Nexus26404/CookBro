const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'dev.db');
const sqlite = new Database(dbPath);
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const seedRecipes = [
  {
    name: '宫保鸡丁',
    icon: '🍗',
    description: '川菜经典，红而不辣，辣而不猛，香辣味浓，肉质滑脆。',
    category: '川菜',
    tags: JSON.stringify(['下饭菜', '经典', '硬菜']),
    difficulty: 'medium',
    servings: 3,
    prepTime: 15,
    cookTime: 10,
    ingredients: JSON.stringify([
      { name: '鸡胸肉', amount: '300g', category: '肉类' },
      { name: '花生米', amount: '50g', category: '干货' },
      { name: '干辣椒', amount: '10g', category: '调料' },
      { name: '花椒', amount: '5g', category: '调料' },
      { name: '大葱', amount: '1根', category: '蔬菜' },
      { name: '姜蒜', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '鸡胸肉切丁，加生抽、料酒、淀粉腌制15分钟。' },
      { order: 2, description: '大葱切小段，姜蒜切片，干辣椒剪段。' },
      { order: 3, description: '调酱汁：生抽、老抽、糖、醋、料酒、淀粉、少许水搅拌均匀。' },
      { order: 4, description: '冷油下花生米炸至金黄捞出，酥脆备用。' },
      { order: 5, description: '热锅凉油，下花椒和干辣椒炒出香味。' },
      { order: 6, description: '下鸡丁炒至变色，加入姜蒜片、葱段爆香。' },
      { order: 7, description: '倒入调好的酱汁大火快速翻炒，最后加入花生米翻匀出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '麻婆豆腐',
    icon: '🧆',
    description: '川菜代表作，具有麻、辣、烫、香、酥、嫩、鲜、活八大特点。',
    category: '川菜',
    tags: JSON.stringify(['快手菜', '下饭菜', '家常菜']),
    difficulty: 'easy',
    servings: 2,
    prepTime: 10,
    cookTime: 10,
    ingredients: JSON.stringify([
      { name: '嫩豆腐', amount: '1块', category: '豆制品' },
      { name: '牛肉末', amount: '50g', category: '肉类' },
      { name: '郫县豆瓣酱', amount: '1大勺', category: '调料' },
      { name: '花椒粉', amount: '1茶匙', category: '调料' },
      { name: '蒜苗', amount: '2根', category: '蔬菜' },
      { name: '姜末蒜泥', amount: '各适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['砂锅' , '炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '豆腐切小块，放入加了少许盐的沸水中焯水，捞出备用。' },
      { order: 2, description: '热锅下油，炒香牛肉末至金黄酥脆。' },
      { order: 3, description: '下郫县豆瓣酱、姜末、蒜泥炒出红油。' },
      { order: 4, description: '加水煮沸，倒入豆腐块，转小火慢炖5分钟入味。' },
      { order: 5, description: '淋入水淀粉勾薄芡，撒上蒜苗碎。' },
      { order: 6, description: '出锅前均匀撒上一层汉源花椒粉。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '白斩鸡',
    icon: '🐔',
    description: '粤菜经典，皮爽肉滑，大筵小席皆宜，配沙姜清酱最佳。',
    category: '粤菜',
    tags: JSON.stringify(['硬菜', '经典', '减脂餐']),
    difficulty: 'hard',
    servings: 4,
    prepTime: 20,
    cookTime: 30,
    ingredients: JSON.stringify([
      { name: '三黄鸡', amount: '1只', category: '肉类' },
      { name: '生姜', amount: '50g', category: '调料' },
      { name: '小葱', amount: '3根', category: '蔬菜' },
      { name: '沙姜', amount: '适量', category: '调料' },
      { name: '花生油', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['汤锅']),
    steps: JSON.stringify([
      { order: 1, description: '整鸡洗净，沥干水分。' },
      { order: 2, description: '大锅烧水，放入葱姜、料酒，烧开后手提鸡头将鸡身浸入水中烫5秒，提起，重复3次（俗称“三提三浸”）。' },
      { order: 3, description: '整鸡放入水中，微沸状态加盖煮20分钟，关火焖10分钟。' },
      { order: 4, description: '捞出后立刻浸入冰水中，至彻底冷却（这能使鸡皮爽脆）。' },
      { order: 5, description: '制作蘸料：生姜、沙姜、小葱剁成碎蓉，加盐，淋上滚烫的花生油激发出香味。' },
      { order: 6, description: '斩件摆盘，搭配蘸料食用。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '蜜汁叉烧',
    icon: '🥓',
    description: '粤式烧腊中的代表，色泽红亮，肉质软嫩多汁，咸甜可口。',
    category: '粤菜',
    tags: JSON.stringify(['硬菜', '甜品', '经典']),
    difficulty: 'medium',
    servings: 4,
    prepTime: 20,
    cookTime: 40,
    ingredients: JSON.stringify([
      { name: '梅花肉', amount: '600g', category: '肉类' },
      { name: '叉烧酱', amount: '3大勺', category: '调料' },
      { name: '蜂蜜', amount: '2大勺', category: '调料' },
      { name: '料酒、生抽', amount: '各1勺', category: '调料' },
      { name: '红腐乳汁', amount: '1勺', category: '调料' }
    ]),
    utensils: JSON.stringify(['烤箱']),
    steps: JSON.stringify([
      { order: 1, description: '梅花肉切成长条，用叉子扎孔方便入味。' },
      { order: 2, description: '加入叉烧酱、红腐乳汁、料酒、生抽拌匀，放入冰箱冷藏腌制24小时。' },
      { order: 3, description: '烤箱预热200度，肉条摆在烤网上。' },
      { order: 4, description: '烘烤20分钟后取出，刷上一层腌肉酱汁和蜂蜜。' },
      { order: 5, description: '翻面再烤15分钟，取出刷上厚厚一层蜂蜜。' },
      { order: 6, description: '最后烤5分钟至微焦，稍微放凉后切片。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '辣椒炒肉',
    icon: '🥩',
    description: '湖南人桌桌必备的下饭神菜，香辣鲜美，肉片滑嫩。',
    category: '湘菜',
    tags: JSON.stringify(['下饭菜', '家常菜', '快手菜']),
    difficulty: 'easy',
    servings: 2,
    prepTime: 10,
    cookTime: 8,
    ingredients: JSON.stringify([
      { name: '前腿肉', amount: '250g', category: '肉类' },
      { name: '螺丝椒', amount: '150g', category: '蔬菜' },
      { name: '豆豉', amount: '1小把', category: '调料' },
      { name: '大蒜', amount: '3瓣', category: '调料' },
      { name: '生抽老抽', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '前腿肉肥瘦分开，瘦肉切薄片用生抽、淀粉和少许油腌制。' },
      { order: 2, description: '螺丝椒滚刀切块，大蒜拍碎。' },
      { order: 3, description: '净锅不放油，下螺丝椒中小火煸炒，用锅铲按压至表皮起虎皮，盛出。' },
      { order: 4, description: '锅内下少许油，下肥肉煸炒出猪油。' },
      { order: 5, description: '下蒜末、豆豉炒香，再下瘦肉片大火快速滑炒至变色。' },
      { order: 6, description: '倒入煸好的辣椒，加生抽、老抽、少许盐大火翻炒1分钟出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '东坡肉',
    icon: '🥩',
    description: '江南传统名菜，慢火细焖，红亮如琥珀，肥而不腻，酥烂香糯。',
    category: '江浙菜',
    tags: JSON.stringify(['硬菜', '经典', '懒人餐']),
    difficulty: 'medium',
    servings: 4,
    prepTime: 15,
    cookTime: 120,
    ingredients: JSON.stringify([
      { name: '五花肉', amount: '800g', category: '肉类' },
      { name: '黄酒', amount: '400ml', category: '调料' },
      { name: '大葱', amount: '1小把', category: '蔬菜' },
      { name: '生姜', amount: '50g', category: '调料' },
      { name: '冰糖', amount: '80g', category: '调料' },
      { name: '生抽、老抽', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['砂锅']),
    steps: JSON.stringify([
      { order: 1, description: '五花肉刮洗干净，整块焯水后切成约5cm见方的大块。' },
      { order: 2, description: '砂锅底部铺满厚厚一层葱段和姜片，以防粘底。' },
      { order: 3, description: '将肉块皮朝下码放在葱姜上。' },
      { order: 4, description: '加入黄酒、生抽、老抽和冰糖，不加一滴水。' },
      { order: 5, description: '大火烧开，转微火极小火慢炖1.5小时。' },
      { order: 6, description: '将肉块翻面（皮朝上），装入炖盅中，倒入原汤，上锅大火蒸半小时，逼出多余油脂。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '锅包肉',
    icon: '🐷',
    description: '东北特色名菜，外沙里嫩，酸甜焦香，咬一口咔嚓响。',
    category: '东北菜',
    tags: JSON.stringify(['经典', '硬菜', '家常菜']),
    difficulty: 'hard',
    servings: 3,
    prepTime: 20,
    cookTime: 20,
    ingredients: JSON.stringify([
      { name: '猪里脊肉', amount: '350g', category: '肉类' },
      { name: '土豆淀粉', amount: '150g', category: '调料' },
      { name: '胡萝卜、香菜', amount: '少许', category: '蔬菜' },
      { name: '白糖', amount: '80g', category: '调料' },
      { name: '白醋/米醋', amount: '60ml', category: '调料' },
      { name: '盐', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '里脊肉切成约0.3-0.5cm的大薄片，加少许盐和料酒抓匀腌制。' },
      { order: 2, description: '土豆淀粉加水调成黏稠的厚糊，让其沉淀后倒掉表面的水，与肉片拌匀。' },
      { order: 3, description: '调汁：白糖、白醋、生抽、盐调和均匀备用。' },
      { order: 4, description: '起锅烧热油至7成热（约180度），肉片逐片展开下锅炸至定型捞出。' },
      { order: 5, description: '升高油温至8成热，下肉片复炸至表皮金黄酥脆捞出沥油。' },
      { order: 6, description: '锅留底油，下胡萝卜丝和香菜，倒入调好的甜酸汁烧开至黏稠。' },
      { order: 7, description: '迅速倒入炸好的肉片大火翻匀，让酱汁裹满肉片即可出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '羊肉泡馍',
    icon: '🍲',
    description: '西北著名小吃，肉烂汤浓，香气四溢，暖胃耐饥。',
    category: '西北菜',
    tags: JSON.stringify(['主食', '经典', '汤羹']),
    difficulty: 'hard',
    servings: 2,
    prepTime: 30,
    cookTime: 180,
    ingredients: JSON.stringify([
      { name: '羊肉/牛肉', amount: '500g', category: '肉类' },
      { name: '面粉（做馍用）', amount: '300g', category: '主食' },
      { name: '粉丝', amount: '1把', category: '干货' },
      { name: '黄花菜、木耳', amount: '少许', category: '干货' },
      { name: '八角桂皮草果', amount: '各适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['汤锅', '平底锅']),
    steps: JSON.stringify([
      { order: 1, description: '肉用冷水泡去血水，加香料包大火烧开转小火慢炖3小时至肉质酥烂，老汤备用。' },
      { order: 2, description: '面粉加极少的水和酵母，揉成较硬的死面团，擀成圆饼，用平底锅无油慢火烙熟成九成熟的“托托馍”。' },
      { order: 3, description: '将馍手掰成花生米大小的碎粒。' },
      { order: 4, description: '大勺舀入原汁羊肉汤，下粉丝、木耳、黄花菜和掰好的馍粒，大火烧开煮2分钟。' },
      { order: 5, description: '出锅前调入盐，码上切好的羊肉片。' },
      { order: 6, description: '搭配糖蒜和辣椒酱一同上桌。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '酸菜鱼',
    icon: '🐟',
    description: '四川家常名菜，酸辣爽口，鱼片滑嫩如豆腐，汤汁鲜美。',
    category: '川菜',
    tags: JSON.stringify(['硬菜', '经典', '下饭菜']),
    difficulty: 'medium',
    servings: 3,
    prepTime: 20,
    cookTime: 15,
    ingredients: JSON.stringify([
      { name: '草鱼/黑鱼', amount: '1条', category: '海鲜' },
      { name: '四川泡酸菜', amount: '200g', category: '蔬菜' },
      { name: '野山椒', amount: '5个', category: '调料' },
      { name: '蛋清', amount: '1个', category: '蛋奶' },
      { name: '青花椒、干辣椒', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '鱼肉切成薄片，用盐、胡椒粉、料酒、蛋清、淀粉抓匀浆好。鱼骨斩件。' },
      { order: 2, description: '酸菜切段，野山椒拍碎。' },
      { order: 3, description: '热锅下油，下姜蒜、酸菜、野山椒炒出香味。' },
      { order: 4, description: '放入鱼头鱼骨翻炒，加入滚开的水大火熬煮10分钟至汤色奶白。' },
      { order: 5, description: '捞出鱼骨垫在盆底，转小火将浆好的鱼片逐片抖落入锅。' },
      { order: 6, description: '鱼片变色发白（约1分钟）立刻连汤倒入盆中。' },
      { order: 7, description: '表面撒上青花椒、干辣椒段、蒜泥，烧热油泼在上面激发出香味。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '番茄炒蛋',
    icon: '🍅',
    description: '中国国民家常菜，红黄相间，酸甜开胃，汤汁拌饭绝佳。',
    category: '家常菜',
    tags: JSON.stringify(['快手菜', '家常菜', '一人食']),
    difficulty: 'easy',
    servings: 2,
    prepTime: 5,
    cookTime: 5,
    ingredients: JSON.stringify([
      { name: '番茄', amount: '2个', category: '蔬菜' },
      { name: '鸡蛋', amount: '3个', category: '蛋奶' },
      { name: '大葱', amount: '1/2根', category: '蔬菜' },
      { name: '白糖', amount: '1茶匙', category: '调料' },
      { name: '盐', amount: '少许', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '番茄切小块，鸡蛋打散加少许盐和水，大葱切碎。' },
      { order: 2, description: '热锅热油，倒入蛋液快速划散，刚凝固即盛出备用。' },
      { order: 3, description: '锅内再加少许油，爆香葱花，倒入番茄块大火翻炒。' },
      { order: 4, description: '加糖和盐，用锅铲按压番茄使其流出汁水，小火焖2分钟。' },
      { order: 5, description: '倒入炒好的鸡蛋，大火快速翻匀，让鸡蛋吸饱番茄汁即可出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '地三鲜',
    icon: '🍆',
    description: '东北家常菜的代表，茄子、土豆和青椒的完美融合，百吃不厌。',
    category: '东北菜',
    tags: JSON.stringify(['家常菜', '经典', '下饭菜']),
    difficulty: 'easy',
    servings: 3,
    prepTime: 15,
    cookTime: 15,
    ingredients: JSON.stringify([
      { name: '茄子', amount: '1根', category: '蔬菜' },
      { name: '土豆', amount: '1个', category: '蔬菜' },
      { name: '青椒', amount: '1个', category: '蔬菜' },
      { name: '生抽老抽', amount: '各1勺', category: '调料' },
      { name: '大蒜', amount: '3瓣', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '土豆去皮切滚刀块，茄子切滚刀块，青椒掰成小块。' },
      { order: 2, description: '热锅烧宽油，土豆下锅炸至边缘金黄微焦捞出。' },
      { order: 3, description: '茄子拍少许淀粉防吸油，下锅炸至变软捞出沥油。' },
      { order: 4, description: '青椒过油5秒捞出。' },
      { order: 5, description: '调汁：生抽、老抽、糖、淀粉、少许清水拌匀。' },
      { order: 6, description: '锅留底油爆香蒜末，倒入三鲜，倒入调味汁大火快速翻炒均匀勾芡出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '蚝油生菜',
    icon: '🥬',
    description: '粤式快手素菜，生菜清脆，蚝油酱汁咸鲜微甜。',
    category: '粤菜',
    tags: JSON.stringify(['快手菜', '减脂餐', '家常菜']),
    difficulty: 'easy',
    servings: 2,
    prepTime: 5,
    cookTime: 3,
    ingredients: JSON.stringify([
      { name: '生菜', amount: '300g', category: '蔬菜' },
      { name: '蚝油', amount: '2大勺', category: '调料' },
      { name: '大蒜', amount: '4瓣', category: '调料' },
      { name: '水淀粉', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '生菜洗净滤干，大蒜剁成细蒜末。' },
      { order: 2, description: '锅内烧开水，加少许盐和几滴油，放入生菜烫15秒立刻捞出控水装盘。' },
      { order: 3, description: '热锅冷油，小火爆香蒜末至金黄。' },
      { order: 4, description: '加入蚝油、少许生抽、糖和水烧开。' },
      { order: 5, description: '淋入少许水淀粉勾芡至酱汁浓稠。' },
      { order: 6, description: '将滚烫的蚝油蒜泥汁均匀淋在生菜表面。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '清蒸鲈鱼',
    icon: '🐟',
    description: '粤菜海鲜之魂，原汁原味，鱼肉鲜嫩，葱香四溢。',
    category: '粤菜',
    tags: JSON.stringify(['经典', '硬菜', '减脂餐']),
    difficulty: 'medium',
    servings: 3,
    prepTime: 10,
    cookTime: 10,
    ingredients: JSON.stringify([
      { name: '鲈鱼', amount: '1条', category: '海鲜' },
      { name: '大葱/小葱', amount: '1把', category: '蔬菜' },
      { name: '生姜', amount: '1块', category: '调料' },
      { name: '蒸鱼豉油', amount: '3大勺', category: '调料' },
      { name: '食用油', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['蒸锅']),
    steps: JSON.stringify([
      { order: 1, description: '鱼身两侧各斜切几刀，用盐和料酒薄薄抹一层，盘底和鱼腹塞姜片、葱段。' },
      { order: 2, description: '蒸锅水烧开，鱼盘入锅大火蒸8分钟，关火虚蒸2分钟。' },
      { order: 3, description: '取出后倒掉盘底的蒸鱼水（这水很腥），去掉旧葱姜。' },
      { order: 4, description: '铺上新鲜的切成极细的葱丝和姜丝。' },
      { order: 5, description: '烧热一大勺食用油至冒青烟，迅速泼在葱姜丝上激发出香味。' },
      { order: 6, description: '沿盘子边缘倒入蒸鱼豉油即可。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '回锅肉',
    icon: '🐷',
    description: '川菜之王，以蒜苗和豆瓣酱红油包裹肥瘦相间肉片，咸鲜微辣。',
    category: '川菜',
    tags: JSON.stringify(['下饭菜', '经典', '家常菜']),
    difficulty: 'medium',
    servings: 3,
    prepTime: 15,
    cookTime: 15,
    ingredients: JSON.stringify([
      { name: '五花肉/二刀肉', amount: '400g', category: '肉类' },
      { name: '蒜苗', amount: '3根', category: '蔬菜' },
      { name: '郫县豆瓣酱', amount: '1.5勺', category: '调料' },
      { name: '豆豉', amount: '1茶匙', category: '调料' },
      { name: '甜面酱', amount: '1/2茶匙', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '肉块入凉水锅，加葱姜料酒煮至刚熟（用筷子能扎透），捞出放凉切成薄片。' },
      { order: 2, description: '蒜苗拍一下，斜切成段。' },
      { order: 3, description: '热锅少油，下肉片中小火煸炒至出油卷曲呈“灯盏窝”状。' },
      { order: 4, description: '将肉片拨到一边，下郫县豆瓣酱和豆豉炒出红油和香味。' },
      { order: 5, description: '下甜面酱和少许糖翻炒均匀。' },
      { order: 6, description: '最后下入蒜苗段大火快速翻炒，至蒜苗断生立刻出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '鱼香肉丝',
    icon: '🥕',
    description: '经典川味，无鱼却有鱼香，酸甜咸辣俱全，口感滑嫩爽脆。',
    category: '川菜',
    tags: JSON.stringify(['下饭菜', '家常菜', '经典']),
    difficulty: 'medium',
    servings: 3,
    prepTime: 20,
    cookTime: 10,
    ingredients: JSON.stringify([
      { name: '猪里脊肉', amount: '250g', category: '肉类' },
      { name: '黑木耳', amount: '50g', category: '干货' },
      { name: '胡萝卜/竹笋', amount: '50g', category: '蔬菜' },
      { name: '泡红辣椒', amount: '2大勺', category: '调料' },
      { name: '葱姜蒜末', amount: '各适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '里脊肉切细丝，加生抽、料酒、淀粉和少许水码味腌制。' },
      { order: 2, description: '木耳、胡萝卜切成细丝。' },
      { order: 3, description: '调鱼香汁：糖、醋、生抽、淀粉、水以特定比例混合。' },
      { order: 4, description: '热锅滑油，下肉丝炒散至变色盛出。' },
      { order: 5, description: '锅内下油，小火炒香泡红辣椒碎，下葱姜蒜末爆香。' },
      { order: 6, description: '倒入木耳丝、胡萝卜丝大火炒熟，倒入肉丝合炒。' },
      { order: 7, description: '倒入鱼香汁大火快速翻炒勾芡，撒上葱花出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '辣子鸡',
    icon: '🌶️',
    description: '重庆名菜，满盘红椒找鸡丁，酥香麻辣，越嚼越香。',
    category: '川菜',
    tags: JSON.stringify(['硬菜', '经典', '宵夜']),
    difficulty: 'hard',
    servings: 4,
    prepTime: 20,
    cookTime: 20,
    ingredients: JSON.stringify([
      { name: '鸡腿肉/鸡整只', amount: '600g', category: '肉类' },
      { name: '干红辣椒', amount: '100g', category: '调料' },
      { name: '花椒', amount: '20g', category: '调料' },
      { name: '熟芝麻', amount: '适量', category: '干货' },
      { name: '葱姜蒜', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '鸡肉斩成小一口大丁，用盐、料酒、五香粉、生抽抓匀腌制30分钟。' },
      { order: 2, description: '干辣椒剪成段，去掉多余辣椒籽。' },
      { order: 3, description: '热锅宽油，油温8成热倒入鸡丁大火炸至表面焦黄干爽，捞出控油。' },
      { order: 4, description: '锅内留少许底油，下葱姜蒜片炒香，下入大量的花椒和干辣椒段小火慢炒出香麻味（小心炒焦）。' },
      { order: 5, description: '倒入炸好的鸡丁大火快速翻炒，加入适量白糖和盐调味。' },
      { order: 6, description: '起锅前撒上熟白芝麻和葱段，翻匀出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '龙井虾仁',
    icon: '🍤',
    description: '杭州传统名菜，用龙井茶配鲜活河虾仁，色泽雅致，鲜嫩清香。',
    category: '江浙菜',
    tags: JSON.stringify(['经典', '减脂餐', '宴客菜']),
    difficulty: 'hard',
    servings: 2,
    prepTime: 25,
    cookTime: 5,
    ingredients: JSON.stringify([
      { name: '活河虾仁', amount: '300g', category: '海鲜' },
      { name: '龙井新茶', amount: '2g', category: '干货' },
      { name: '蛋清', amount: '1/2个', category: '蛋奶' },
      { name: '淀粉/绍兴黄酒', amount: '适量', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '河虾仁用盐洗净，沥干水分。用蛋清、淀粉抓匀上浆，入冰箱冷藏1小时。' },
      { order: 2, description: '龙井茶用85度左右的热水冲泡，滤出茶水备用，留少许茶叶装饰。' },
      { order: 3, description: '热锅冷油，将上浆的虾仁倒入快速滑油至变白，立刻捞出沥油。' },
      { order: 4, description: '锅内留微量油，下虾仁，攒入少许黄酒，倒入约3大勺茶水。' },
      { order: 5, description: '大火快速翻炒几下，勾薄芡，最后撒上几片龙井茶叶兜匀出锅。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '西湖醋鱼',
    icon: '🐟',
    description: '杭州名菜，鱼肉嫩如蟹肉，浇上酸甜略带蟹香的醋汁，别具风味。',
    category: '江浙菜',
    tags: JSON.stringify(['经典', '硬菜', '宴客菜']),
    difficulty: 'hard',
    servings: 3,
    prepTime: 15,
    cookTime: 10,
    ingredients: JSON.stringify([
      { name: '草鱼/鲈鱼', amount: '1条', category: '海鲜' },
      { name: '绍兴黄酒', amount: '2勺', category: '调料' },
      { name: '镇江香醋/白糖', amount: '各3勺', category: '调料' },
      { name: '生姜', amount: '30g', category: '调料' },
      { name: '生抽', amount: '1大勺', category: '调料' }
    ]),
    utensils: JSON.stringify(['平底锅']),
    steps: JSON.stringify([
      { order: 1, description: '鱼洗净，从背部剖开两半但不切断。' },
      { order: 2, description: '大锅烧水，加生姜、黄酒，水微沸时将鱼平铺入锅中烫煮5分钟至熟捞出，装盘。' },
      { order: 3, description: '另起锅调汁：倒入原鱼汤、香醋、糖、生抽、少许黄酒烧开。' },
      { order: 4, description: '倒入水淀粉勾浓芡，淋入少许熟油使糖醋芡汁发亮。' },
      { order: 5, description: '将芡汁均匀浇在蒸熟的鱼身表面。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '剁椒鱼头',
    icon: '🐟',
    description: '湘菜经典，大块鱼头盖满红绿剁椒，鲜辣咸香，鱼肉极其鲜嫩。',
    category: '湘菜',
    tags: JSON.stringify(['硬菜', '经典', '下饭菜']),
    difficulty: 'medium',
    servings: 3,
    prepTime: 15,
    cookTime: 15,
    ingredients: JSON.stringify([
      { name: '胖头鱼头', amount: '1个', category: '海鲜' },
      { name: '湖南剁椒', amount: '150g', category: '调料' },
      { name: '大蒜、生姜', amount: '各适量', category: '调料' },
      { name: '蒸鱼豉油', amount: '2勺', category: '调料' },
      { name: '小葱花', amount: '1把', category: '蔬菜' }
    ]),
    utensils: JSON.stringify(['蒸锅']),
    steps: JSON.stringify([
      { order: 1, description: '鱼头对半剖开（不切断），用盐、料酒抹匀腌制10分钟，平铺在码有姜片葱段的盘里。' },
      { order: 2, description: '热锅下油，炒香蒜末、生姜末，倒入剁椒小火翻炒出香味。' },
      { order: 3, description: '炒好的剁椒均匀铺满整个鱼头表面。' },
      { order: 4, description: '蒸锅水开后，将鱼头盘入锅大火蒸12分钟，取出沥掉少许腥水，淋蒸鱼豉油。' },
      { order: 5, description: '撒上大量葱花。' },
      { order: 6, description: '烧热一大勺食用油泼在葱花上激发出香味。' }
    ]),
    createdBy: 'system'
  },
  {
    name: '可乐鸡翅',
    icon: '🍗',
    description: '风靡大江南北的快手菜，鸡翅裹满焦糖色，可乐香甜软烂，大人小孩都爱。',
    category: '小吃',
    tags: JSON.stringify(['快手菜', '家常菜', '儿童餐']),
    difficulty: 'easy',
    servings: 2,
    prepTime: 10,
    cookTime: 15,
    ingredients: JSON.stringify([
      { name: '鸡翅中', amount: '10个', category: '肉类' },
      { name: '可口可乐', amount: '1罐(330ml)', category: '调料' },
      { name: '生姜', amount: '20g', category: '调料' },
      { name: '小葱', amount: '2根', category: '蔬菜' },
      { name: '生抽老抽', amount: '各1大勺', category: '调料' }
    ]),
    utensils: JSON.stringify(['炒锅']),
    steps: JSON.stringify([
      { order: 1, description: '鸡翅正反面各划两刀，用冷水加料酒焯水去腥，捞出控干。' },
      { order: 2, description: '热锅下油，下鸡翅中火煎至两面金黄上色。' },
      { order: 3, description: '下姜片和葱段略微翻炒。' },
      { order: 4, description: '倒入整罐可乐，加入生抽、老抽调色。' },
      { order: 5, description: '大火烧开，转中小火加盖焖煮10-12分钟。' },
      { order: 6, description: '拿掉葱姜，转大火快速收汁，至可乐糖分粘稠裹满每个鸡翅表面即可出锅。' }
    ]),
    createdBy: 'system'
  }
];

async function main() {
  console.log('Start seeding 20 Chinese recipes...');
  
  // Clear existing recipes to avoid duplicates during multiple seeds
  await prisma.recipe.deleteMany({
    where: {
      createdBy: 'system'
    }
  });

  for (const r of seedRecipes) {
    const res = await prisma.recipe.create({
      data: r
    });
    console.log(`Seeded recipe: ${res.name}`);
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
