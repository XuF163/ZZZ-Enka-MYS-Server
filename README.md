### 一种基于EnkaZZZ API的Yunzai ZZZ-Plugin面向设备🐎的、适用于handler形式的外置面板更新服务端  
### 简介  
在MYS API更新ZZZ面板报错时候，作为Handler处理报错，转发请求到本服务端，本服务端通过EnkaZZZ API获取数据并尝试对其MYS数据字段以期达到面板更新纸目的。    
效果展示请[查看图片](#section1) 
### 使用方法
1. 在你的handler.js中，请求目标url修改为为你部署此服务端的地址（e.g ip+端口+路径)  
2.安装本项目依赖并运行  
```bash
pnpm i --registry=https://registry.npmmirror.com && node .
```
3.handler[参考构建](https://github.com/XuF163/ZZZ-Enka-MYS-Server/blob/master/%E6%94%BEexample%E4%B8%8B%E9%9D%A2.js)  
```  
export class Handler extends plugin { //丢example里即可  
  constructor() {
    super({
      name: '',
      namespace: 'API',
      priority: Infinity,
      handler: [{
        key: 'mys.req.err',
        fn: 'mysReqErrHandler'
      }]
    })
  }

async mysReqErrHandler(e, args, reject) {
/*
  在此处请求你的自建API即可.
  传入CK和需要查询的API地址.
*/
  }
}

```
### 使用说明  
4.19 已经实现较为准确的圣遗物/角色属性转换能力，仅测试过有CK且未**绑定设备**时候的 **%更新面板**以及具体角色面板查询能力.  

### 潜在问题、免责声明与权利声明  
1.推荐使用ZZZ-Plugin内置enka源, 本仓库仅供测试用途, 亦不承诺随绝区零新版本更新任何json文件.    
2.使用此服务端后ZZZ插件处仍然需要扫码登录，本handler服务端仅在Mys报错后生效，请确保多个handler存在时**最后**调用本服务端.  
3.如果你有多个handler ,则不能保证你的handler**不与其它handler冲突**，介意请慎用，或自行做出修改.  
4.本服务端需要传入用户CK，请自行搭建并避免使用所谓的**公共**/**公益**服务端.  
5.开源协议跟随上游项目，本库无其余权利主张  

### 致谢  
1.[ZZZuid](https://github.com/ZZZure/ZZZeroUID)  本仓库cv了其解析数据源json  
2.[Enka.network](Enka.network)  本仓库使用其数据源  
3.[ZZZ-plugin](https://github.com/ZZZure/ZZZ-Plugin)  本仓库cv了其数据格式

### 效果展示  
<a id="section1"></a>  
上面是本项目返回的，下面是Enka官网查询的
![41bb8d4d94d2f2a6e98f7797759fb777](https://github.com/user-attachments/assets/c4a1f06b-1052-470f-b183-517e5caabe96)
![57903b5bb02398ad0e0b3f9279b9c637](https://github.com/user-attachments/assets/8f740766-74aa-427d-86d1-7eddef605447)  


