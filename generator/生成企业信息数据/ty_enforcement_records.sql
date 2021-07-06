/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50717
Source Host           : localhost:3307
Source Database       : test

Target Server Type    : MYSQL
Target Server Version : 50717
File Encoding         : 65001

Date: 2021-07-06 14:53:28
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for ty_enforcement_records
-- ----------------------------
DROP TABLE IF EXISTS `ty_enforcement_records`;
CREATE TABLE `ty_enforcement_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `person` varchar(155) DEFAULT NULL COMMENT '被检查单位',
  `address` varchar(155) DEFAULT NULL COMMENT '单位地址',
  `legal` varchar(155) DEFAULT NULL COMMENT '法人',
  `legalPhone` varchar(20) DEFAULT NULL COMMENT '联系方式',
  `streetId` int(11) DEFAULT '0' COMMENT '所属街道id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=222 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of ty_enforcement_records
-- ----------------------------
INSERT INTO `ty_enforcement_records` VALUES ('1', '测试', '1', '小刘', '测试', '0');
INSERT INTO `ty_enforcement_records` VALUES ('2', '测试', '测试', '测试', '测试', '0');
INSERT INTO `ty_enforcement_records` VALUES ('3', '测试', '测试', '测试', '测试', '0');
INSERT INTO `ty_enforcement_records` VALUES ('4', 'c', 'dd', 'dddd', 'fafa', '0');
INSERT INTO `ty_enforcement_records` VALUES ('5', '汤泉阳光（北京）国际健身俱乐部有限公司', '北京市海淀区西四环北125号德祥家园7号楼1单元一层美逸商务酒店1008', '', '', '22');
INSERT INTO `ty_enforcement_records` VALUES ('6', '长峰假日酒店有限公司', '海淀区永定路50号', '潘琪', '', '16');
INSERT INTO `ty_enforcement_records` VALUES ('7', '北京极度体验户外探险运动有限公司海淀分公司', '海淀区远大路1号一层商业Z1026', '高钦', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('8', '北京铁建物业管理有限公司', '复兴路40号', '舒思林', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('9', '北京大学', '海淀区中关村北大街149号地下二层', '李倩', '1352224445555', '0');
INSERT INTO `ty_enforcement_records` VALUES ('10', '测试', '海淀区中关村北大街149号地下二层', '小刘', '12345', '0');
INSERT INTO `ty_enforcement_records` VALUES ('11', '北京大学', '123', '董齐', '456；9', '0');
INSERT INTO `ty_enforcement_records` VALUES ('12', '北京益欣安盛体育发展有限公司', '海淀区万柳华府北街9号院10号楼一1层-102-14', '程军', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('13', '海淀区万柳华府海园1号楼', '北京亚历山大东直门健身休闲有限公司海淀第一分公司', '王仁磊', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('14', '月', '土', '子', '2222', '0');
INSERT INTO `ty_enforcement_records` VALUES ('15', '北京爱尚奇缘体育文化发展有限公司', '海淀区龙翔路15号辰茂鸿翔酒店一层', '王涛', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('16', '时', '问', '刘', '123', '0');
INSERT INTO `ty_enforcement_records` VALUES ('17', '北京力健搜候体育文化发展有限公司', '海淀区后屯南路26号5层6-78/3层3-78', '', '', '23');
INSERT INTO `ty_enforcement_records` VALUES ('18', '奥格晨光（北京）科技有限公司', '海淀区上地信息路19号1号楼-1层002-1', '胡业宝', '', '17');
INSERT INTO `ty_enforcement_records` VALUES ('19', '尚体力动体育文化发展（北京）有限公司', '北京市海淀区农大南路43号', '', '', '17');
INSERT INTO `ty_enforcement_records` VALUES ('20', '北京燕归园物业管理有限责任公司', '北京燕归园七彩物业管理有限责任公司', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('21', '北京香格里拉饭店', '海淀区紫竹院路20号', '何剑波', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('22', '福朋喜来登酒店', '海淀区远大路25号', '崔如珍', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('23', '北京卓盛兴飞体育发展有限公司', '海淀区西三环中路17号2号楼地下室一层B102', '鲍成林', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('24', '北京奇迹米高健身管理有限公司', '海淀区昆明湖南路51号F座32号', '高鹏', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('25', '北京市海淀区体育场馆管理中心', '海淀区颐和园路12号', '赵志华', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('26', '北京市海淀区体育场馆管理中心（温泉中心）', '海淀区白家曈东路9号院1号楼', '赵志华', '', '26');
INSERT INTO `ty_enforcement_records` VALUES ('27', '北京亲水湾康体俱乐部有限公司', '海淀区万寿路西街2号B1层', '潭晓伟', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('28', '北京京都信苑饭店有限公司', '海淀区什坊院6号', '周山', '', '1');
INSERT INTO `ty_enforcement_records` VALUES ('29', '北京铁建物业管理有限公司', '海淀区复兴路40号', '赵军', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('30', '北京西山居酒店管理有限公司', '海淀区德惠路1号院13号楼地上三层', '郭要强', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('31', '北京零度阳光体育文化有限公司冠军溜冰场', '北京市海淀区远大路1号bc-b201', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('32', '北京柳浪游泳馆有限责任公司', '海淀区六郎庄村颐和园南门往南300米处', '刘宾', '', '24');
INSERT INTO `ty_enforcement_records` VALUES ('33', '测试', '测试卷', '李专', '1234566', '1');
INSERT INTO `ty_enforcement_records` VALUES ('34', '北京科技大学(游泳馆)', '海淀区学院路30号北京科技大学院内', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('35', '北京市瑞德石油新技术公司（游泳馆）', '北京市海淀区学院路20号7区一1北平房三间', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('36', '北京和泓物业服务有限公司交大嘉园分公司', '海淀区交通大学路1号院7号楼', '', '', '5');
INSERT INTO `ty_enforcement_records` VALUES ('37', '北京优越搜候体育文化有限公司', '海淀区大柳树富海中心2号楼201 202 207 208', '周桂菊', '', '5');
INSERT INTO `ty_enforcement_records` VALUES ('38', '北京乐迈健身', '海淀区永定路乙1号院14号楼会所01层', '', '', '16');
INSERT INTO `ty_enforcement_records` VALUES ('39', '首都体育学院', '北京市海淀区北三环西路11号', '', '', '6');
INSERT INTO `ty_enforcement_records` VALUES ('40', '北京思源天佑游泳俱乐部有限公司', '北京市海淀区皂君庙12号', '', '', '5');
INSERT INTO `ty_enforcement_records` VALUES ('41', '北京语言大学', '海淀区学院路15号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('42', '北京华体登临体育场管理有限公司', '海淀区大有庄100号', '', '', '11');
INSERT INTO `ty_enforcement_records` VALUES ('43', '清华大学陈明游泳馆', '北京市海淀区清华大学院内', '', '', '20');
INSERT INTO `ty_enforcement_records` VALUES ('44', '北京乐府江南健身有限公司', '海淀区永定路乙1号院14号楼会所01层', '', '', '16');
INSERT INTO `ty_enforcement_records` VALUES ('45', '八粒国际文化传媒（北京）有限公司', '海淀区远大路6号院1号院楼五层501号', '宋扬', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('46', '北京乐享时代体育发展有限公司远大路分公司', '海淀区远大路1号地下一层35-MO2', '吴艳', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('47', '红人（北京）运动俱乐部有限公司', '海淀区远大路1号商业楼6层', '田晓红', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('48', '西山滑雪场', '海淀区双坡路西山滑雪场', '', '', '26');
INSERT INTO `ty_enforcement_records` VALUES ('49', '北京汇通诺尔狂飙运动休闲有限公司', '海淀区苏家坨镇南安河路1号', '', '', '27');
INSERT INTO `ty_enforcement_records` VALUES ('50', '北京康桥水郡游泳健身中心有限公司公司', '海淀区泉宗路10号院内配套楼地下一层', '杨家辉', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('51', '北京万柳钧越体育投资有限公司', '海淀区万柳中路6号院楼顶层', '刘建军', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('52', '华熙冰雪体育管理（北京）有限公司', '海淀区西四环中路16号院2号楼2层202-4A', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('53', '加州动力（北京）健身有限公司', '海淀区永定路乙1号院14号楼会所01层', '', '', '16');
INSERT INTO `ty_enforcement_records` VALUES ('54', '北京江洋骅鑫体育文化发展有限公司', '海淀区万寿路甲1号中海紫金苑', '', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('55', '首都体育学院', '海淀区北三环西路11号', '', '', '6');
INSERT INTO `ty_enforcement_records` VALUES ('56', '北京嘉运健身有限公司', '海淀区马连洼竹园30号楼2层225室', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('57', '北京华夏致远体育文化发展有限公司', '海淀区罗庄北里锦秋家园7号楼地下一层101', '', '', '6');
INSERT INTO `ty_enforcement_records` VALUES ('58', '北京恒富休闲俱乐部有限公司海淀分公司', '海淀区建材城富力桃园25号楼', '', '', '13');
INSERT INTO `ty_enforcement_records` VALUES ('59', '北京印象博奥体育文化发展有限公司', '海淀区阜成路115号7号楼地下一层（住宅）', '', '', '3');
INSERT INTO `ty_enforcement_records` VALUES ('60', '北京压力山大东直门健身休闲有限公司海淀第一分公司', '海淀区万柳华府海园1号楼', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('61', '北京朗丽兹西山花园酒店管理有限公司', '海淀区丰智东路13号', '王宝', '', '25');
INSERT INTO `ty_enforcement_records` VALUES ('62', '北京马奈国际商业运行管理有限公司', '海淀区四季青桥西南角通达休闲园002号房间', '金锡顺', '', '22');
INSERT INTO `ty_enforcement_records` VALUES ('63', '颐和园公园', '海淀颐和园', '', '', '11');
INSERT INTO `ty_enforcement_records` VALUES ('64', '紫竹院公园冰场（紫玺东来）', '中关村南大街35号', '', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('65', '北京宾宇体育文化发展有限公司', '海淀区翠微中里14号楼三层A527', '', '', '1');
INSERT INTO `ty_enforcement_records` VALUES ('66', '北京大学滑冰场', '北京市海淀区颐和园路5号', '', '', '19');
INSERT INTO `ty_enforcement_records` VALUES ('67', '北京大学邱德拔体育馆', '海淀区颐和园路5号', '', '', '19');
INSERT INTO `ty_enforcement_records` VALUES ('68', '北京大学游泳馆', '海淀区颐和园路5号', '', '', '19');
INSERT INTO `ty_enforcement_records` VALUES ('69', '清华大学陈明游泳馆', '北京市海淀区清华大学院内', '', '', '20');
INSERT INTO `ty_enforcement_records` VALUES ('70', '清华大学冰场', '清华大学内', '', '', '20');
INSERT INTO `ty_enforcement_records` VALUES ('71', '北京市玉渊潭公园管理处', '北京市海淀区西三环中路十号', '', '', '1');
INSERT INTO `ty_enforcement_records` VALUES ('72', '北京北外科技园有限责任公司', '海淀区西三环北路2号', '杨诚', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('73', '北京北外科技园有限责任公司', '海淀区西三环北路2号', '杨诚', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('74', '北京香格里拉饭店有限公司', '海淀区紫竹院路29号', '', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('75', '北京香格里拉饭店有限公司', '海淀区紫竹院路29号', '', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('76', '北京裕龙国际酒店', '北京市海淀区阜成路40号', '保健山', '', '2');
INSERT INTO `ty_enforcement_records` VALUES ('77', '北京裕龙国际酒店', '北京市海淀区阜成路40号', '保健山', '', '2');
INSERT INTO `ty_enforcement_records` VALUES ('78', '北京汇通诺尔狂颷运动休闲有限公司', '海淀区苏家坨镇南安河路1号', '', '', '27');
INSERT INTO `ty_enforcement_records` VALUES ('79', '北京汇通诺尔狂颷运动休闲有限公司', '海淀区苏家坨镇南安河路1号', '', '', '27');
INSERT INTO `ty_enforcement_records` VALUES ('80', '北京汇通诺尔狂颷运动休闲有限公司', '海淀区苏家坨镇南安河路1号', '', '', '27');
INSERT INTO `ty_enforcement_records` VALUES ('81', '北京汇通诺尔狂颷运动休闲有限公司', '海淀区苏家坨镇南安河路1号', '', '', '27');
INSERT INTO `ty_enforcement_records` VALUES ('82', '北京汇通诺尔狂颷运动休闲有限公司', '海淀区苏家坨镇南安河路1号', '', '', '27');
INSERT INTO `ty_enforcement_records` VALUES ('83', '北京汇通诺尔狂颷运动休闲有限公司', '海淀区苏家坨镇南安河路1号', '', '', '27');
INSERT INTO `ty_enforcement_records` VALUES ('84', '北京汇通诺尔狂飙运动休闲有限公司', '海淀区苏家坨镇南安河路1号', '', '', '27');
INSERT INTO `ty_enforcement_records` VALUES ('85', '北京顶级健身有限责任公司', '北京海淀区曙光花园望河园5号楼1层101', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('86', '北京顶级健身有限责任公司', '北京海淀区曙光花园望河园5号楼1层101', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('87', '北京顶级健身有限责任公司', '北京海淀区曙光花园望河园5号楼1层101', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('88', '北京顶级健身有限责任公司', '北京海淀区曙光花园望河园5号楼1层101', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('89', '北京启迪宏奥体育文化发展有限公司', '北京市海淀区北洼村62号北京福特宝足球发展公司南楼1层1003号', '', '', '3');
INSERT INTO `ty_enforcement_records` VALUES ('90', '北京零度阳光体育文化有限公司冠军溜冰场', '北京市海淀区远大路1号bc-b201', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('91', '北京思源天佑游泳俱乐部有限公司', '北京市海淀区皂君庙12号', '', '', '5');
INSERT INTO `ty_enforcement_records` VALUES ('92', '北京华体登临体育场馆管理有限公司', '北京市海淀区大有庄100号', '', '', '11');
INSERT INTO `ty_enforcement_records` VALUES ('93', '首都体育学院', '北京市海淀区北三环西路11号', '', '', '6');
INSERT INTO `ty_enforcement_records` VALUES ('94', '北京丁凡网络技术有限公司', '北京市海淀区中关村南大街2号b座三层商业f3-219', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('95', '北京丁凡网络技术有限公司', '北京市海淀区中关村南大街2号b座三层商业f3-219', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('96', '北京丁凡网络技术有限公司', '北京市海淀区中关村南大街2号b座三层商业f3-219', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('97', '北京丁凡网络技术有限公司', '北京市海淀区中关村南大街2号b座三层商业f3-219', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('98', '北京迈速体育科技有限公司', '北京市海淀区清河嘉园东区1号楼2层201室', '', '', '10');
INSERT INTO `ty_enforcement_records` VALUES ('99', '北京香山高尔夫俱乐部有限公司', '四季青镇祁家村108号', '', '', '22');
INSERT INTO `ty_enforcement_records` VALUES ('100', '北京迈速体育科技有限公司', '北京市海淀区清河嘉园东区1号楼2层201室', '', '', '10');
INSERT INTO `ty_enforcement_records` VALUES ('101', '北京市海淀区清河嘉园东区1号楼2层201室', '北京迈速体育科技有限公司', '', '', '10');
INSERT INTO `ty_enforcement_records` VALUES ('102', '北京唯朗健康管理有限公司', '北京市海淀区学院路30号科大天工大厦3层305室', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('103', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦五层L501', '', '', '24');
INSERT INTO `ty_enforcement_records` VALUES ('104', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('105', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('106', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('107', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('108', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('109', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('110', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('111', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('112', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('113', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('114', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('115', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('116', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('117', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦5层L502', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('118', '北京健力中关健身有限公司', '北京市海淀区丹棱街甲1号6层601', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('119', '北京健力中关健身有限公司', '北京市海淀区丹棱街甲1号6层601', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('120', '北京健力中关健身有限公司', '北京市海淀区丹棱街甲1号6层601', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('121', '北京健力中关健身有限公司', '北京市海淀区丹棱街甲1号6层601', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('122', '北京曙光时尚网球俱乐部有限公司', '北京市海淀区板井路正福寺19号', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('123', '北京曙光时尚网球俱乐部有限公司', '北京市海淀区板井路正福寺19号', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('124', '北京燕西文化发展有限公司', '北京市海淀区四季青镇巨山路21号', '', '', '22');
INSERT INTO `ty_enforcement_records` VALUES ('125', '北京燕西文化发展有限公司', '北京市海淀区四季青镇巨山路21号', '', '', '22');
INSERT INTO `ty_enforcement_records` VALUES ('126', '北京燕西文化发展有限公司', '北京市海淀区四季青镇巨山路21号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('127', '北京燕西文化发展有限公司', '北京市海淀区四季青镇巨山路21号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('128', '北京东升博展晟达商贸有限公司', '北京市海淀区西小口路66号中关村东升科技园北领地锅炉厂附属设施楼1层102', '', '', '23');
INSERT INTO `ty_enforcement_records` VALUES ('129', '北京悦华庭酒店管理有限公司', '北京市海淀区西小口路66号中关村东升科技园c-5', '', '', '23');
INSERT INTO `ty_enforcement_records` VALUES ('130', '北京峰楠漾健身有限公司宝胜路分公司', '北京市海淀区宝盛里观林园26号楼1-2层101', '', '', '23');
INSERT INTO `ty_enforcement_records` VALUES ('131', '北京体世灵克体育场馆经营管理有限公司', '北京市海淀区正福寺8号', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('132', '北京金翔天美体育文化发展有限公司海淀分公司', '北京市海淀区北清路68号院16号楼01-03层', '', '', '25');
INSERT INTO `ty_enforcement_records` VALUES ('133', '威康健身管理咨询（北京）有限公司北京第三分公司', '北京市海淀区复兴路51号1幢5层5001-18号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('134', '北京卡莫蓬佑健身服务有限公司非凡分公司', '北京市海淀区复兴路51号1幢3层3001-18119号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('135', '北京卡莫蓬佑健身服务有限公司万柳分公司', '巴沟路2号BHG Mall北京华联万柳购物中心4层', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('136', '北京武肆健身有限公司', '北京市海淀区中关村大街11号北科置业大厦b1层b1103', '', '', '8');
INSERT INTO `ty_enforcement_records` VALUES ('137', '北京阳光立方国际健身俱乐部有限公司', '北京市海淀区善缘街1号1层25', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('138', '北京极度英睿体育文化发展有限公司', '北京市海淀区文慧园北路9号今典花园9号楼地下一层219号一层9号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('139', '北京宝莲锐客体育发展有限公司', '海淀区北洼西里48号北京福特宝足球发展公司一层101室', '', '', '3');
INSERT INTO `ty_enforcement_records` VALUES ('140', '北京宝联游泳场管理有限责任公司', '海淀区北洼西里48号北京福特宝足球发展公司一层3001室', '', '', '3');
INSERT INTO `ty_enforcement_records` VALUES ('141', '北京英睿顶盛体育文化发展有限公司', '北京市海淀区王庄路1号院2号楼-1-15号', '', '', '20');
INSERT INTO `ty_enforcement_records` VALUES ('142', '北京海比特体育发展有限公司甘家口分店', '北京市海淀区甘家口12号楼一层1号', '', '', '2');
INSERT INTO `ty_enforcement_records` VALUES ('143', '威康健身管理咨询（北京）有限公司北京第三分公司', '北京市海淀区复兴路51号1幢5层5001-18号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('144', '北京阳光天鼎体育有限公司大钟寺分公司', '北京市海淀区北三环西路23号北京蓝景丽家大钟寺商贸有限公司Y-001-001', '', '', '6');
INSERT INTO `ty_enforcement_records` VALUES ('145', '北京燕归园物业管理有限责任公司', '北京燕归园七彩物业管理有限责任公司', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('146', '北京燕归园物业管理有限责任公司', '北京燕归园七彩物业管理有限责任公司', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('147', '尚体力动体育文化发展（北京）有限公司', '北京市海淀区农大南路43号', '', '', '17');
INSERT INTO `ty_enforcement_records` VALUES ('148', '尚体力动体育文化发展（北京）有限公司', '北京市海淀区农大南路43号', '', '', '17');
INSERT INTO `ty_enforcement_records` VALUES ('149', '北京鹏联福达体育发展有限公司', '北京市海淀区农大南路树村东口路北平房', '', '', '17');
INSERT INTO `ty_enforcement_records` VALUES ('150', '北京星耀九洲体育发展有限公司', '北京市海淀区天秀花园古月园26号楼一层东侧', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('151', '北京星耀九洲体育发展有限公司', '北京市海淀区天秀花园古月园26号楼一层东侧', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('152', '北京星耀九洲体育发展有限公司', '北京市海淀区天秀花园古月园26号楼一层东侧', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('153', '北京健佳美体育发展有限公司', '北京市海淀区天秀路9-5号院落东侧102室', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('154', '北京健佳美体育发展有限公司', '北京市海淀区天秀路9-5号院落东侧102室', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('155', '北京健佳美体育发展有限公司', '北京市海淀区天秀路9-5号院落东侧102室', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('156', '北京健佳美体育发展有限公司', '北京市海淀区天秀路9-5号院落东侧102室', '', '', '14');
INSERT INTO `ty_enforcement_records` VALUES ('157', '北京康羽朗健体育发展有限公司', '北京市海淀区朱房西洼88号', '', '', '17');
INSERT INTO `ty_enforcement_records` VALUES ('158', '北京康羽朗健体育发展有限公司', '北京市海淀区朱房西洼88号', '', '', '17');
INSERT INTO `ty_enforcement_records` VALUES ('159', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦五层L501', '', '', '24');
INSERT INTO `ty_enforcement_records` VALUES ('160', '北京金吉鸟健身服务有限公司第五分公司', '北京市海淀区中关村大街19号新中关大厦五层L501', '', '', '24');
INSERT INTO `ty_enforcement_records` VALUES ('161', '汤泉阳光（北京）国际健身俱乐部有限公司', '北京市海淀区西四环北125号德祥家园7号楼1单元一层美逸商务酒店1008', '', '', '22');
INSERT INTO `ty_enforcement_records` VALUES ('162', '汤泉阳光（北京）国际健身俱乐部有限公司', '北京市海淀区西四环北125号德祥家园7号楼1单元一层美逸商务酒店1008', '', '', '22');
INSERT INTO `ty_enforcement_records` VALUES ('163', '北京爱尚十二星座体育文化发展有限公司', '北京市海淀区云会里远流清园3号楼1层102室', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('164', '北京爱尚十二星座体育文化发展有限公司', '北京市海淀区云会里远流清园3号楼1层102室', '', '', '18');
INSERT INTO `ty_enforcement_records` VALUES ('165', '北京铁馆体育发展有限责任公司', '海淀区海淀北二街10号B1层B1-5室', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('166', '北京铁馆体育发展有限责任公司', '海淀区海淀北二街10号B1层B1-5室', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('167', '北京阳光立方国际健身俱乐部有限公司', '北京市海淀区善缘街1号1层25', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('168', '北京阳光立方国际健身俱乐部有限公司', '北京市海淀区善缘街1号1层25', '', '', '7');
INSERT INTO `ty_enforcement_records` VALUES ('169', '北京康典力倍体育文化有限公司', '海淀区建西苑中里1号楼-1层东南角', '', '', '16');
INSERT INTO `ty_enforcement_records` VALUES ('170', '北京康典力倍体育文化有限公司', '海淀区建西苑中里1号楼-1层东南角', '', '', '16');
INSERT INTO `ty_enforcement_records` VALUES ('171', '北京议武堂体育文化有限公司', '北京市海淀区建西苑中里1号楼2层商业235号', '', '', '16');
INSERT INTO `ty_enforcement_records` VALUES ('172', '北京世纪金源香山商旅酒店发展有限责任公司', '北京市海淀区北正黄旗59号', '', '', '12');
INSERT INTO `ty_enforcement_records` VALUES ('173', '北京友谊宾馆康乐部', '北京市海淀区中关村南大街1号北京友谊宾馆康体中心', '', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('174', '北京友谊宾馆康乐部', '北京市海淀区中关村南大街1号北京友谊宾馆康体中心', '', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('175', '北京友谊宾馆康乐部', '北京市海淀区中关村南大街1号北京友谊宾馆康体中心', '', '', '4');
INSERT INTO `ty_enforcement_records` VALUES ('176', '北京语言大学', '海淀区学院路15号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('177', '北京语言大学', '海淀区学院路15号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('178', '北京语言大学', '海淀区学院路15号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('179', '北京语言大学', '海淀区学院路15号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('180', '北京语言大学', '海淀区学院路15号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('181', '北京语言大学', '海淀区学院路15号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('182', '北京语言大学', '海淀区学院路15号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('183', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('184', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('185', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('186', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('187', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('188', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('189', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('190', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('191', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('192', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('193', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('194', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('195', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('196', '中国地质大学（北京）', '北京市海淀区学院路29号', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('197', '华润置地(北京)物业管理有限责任公司华清嘉园健身俱乐部', '北京市海淀区五道口东升园12号楼', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('198', '华润置地(北京)物业管理有限责任公司华清嘉园健身俱乐部', '北京市海淀区五道口东升园12号楼', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('199', '华润置地(北京)物业管理有限责任公司华清嘉园健身俱乐部', '北京市海淀区五道口东升园12号楼', '', '', '9');
INSERT INTO `ty_enforcement_records` VALUES ('200', '蜕变阳光（北京）国际健身俱乐部有限公司', '海淀区志强北园30号楼地下三层', '', '', '6');
INSERT INTO `ty_enforcement_records` VALUES ('201', '蜕变阳光（北京）国际健身俱乐部有限公司', '海淀区志强北园30号楼地下三层', '', '', '6');
INSERT INTO `ty_enforcement_records` VALUES ('202', '北京奇迹米高健身管理有限公司', '海淀区昆明湖南路51号下座32号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('203', '北京奇迹米高健身管理有限公司', '海淀区昆明湖南路51号下座32号', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('204', '北京奇迹米高健身管理有限公司', '海淀区昆明湖南路51号下座32号', '', '', '22');
INSERT INTO `ty_enforcement_records` VALUES ('205', 'dongbaitr', 'haidainqu ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('206', 'dongbaitr', 'haidainqu ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('207', 'dongbaitr', 'haidainqu ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('208', 'dongbaitr', 'haidainqu ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('209', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('210', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('211', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('212', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('213', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('214', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('215', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('216', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('217', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('218', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('219', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('220', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
INSERT INTO `ty_enforcement_records` VALUES ('221', 'ahaidiantiyuju ', 'cccv ', '', '', '0');
