<template>
  <div class="MockClient">
    <header class="header">
      <h3 style="min-width: 80px;">代理地址</h3>
      <el-input v-model="proxyTarget" placeholder="请输入代理ip" style="width: 240px;margin-right: 10px;"></el-input>
      <el-button :loading="proxyLoading" @click="apply" type="primary">Apply</el-button>
      <el-button type="primary" plain @click="add">Add</el-button>
      <el-button type="primary" plain @click="edit">Edit</el-button>
      <el-button @click="reset" type="danger" :loading="proxyLoading">Reset</el-button>
      <el-button type="success" @click="openSingleProxy">Single Proxy</el-button>
    </header>
    <div class="apiList">
      <div class="apis">
        <div class="api" v-for="api in apiConfig.list" :key="api.url" :class="{active: api.active}" @click="clickApi(api)">
          {{api.url}}
        </div>
      </div>
      <div class="responseView">
        <code v-html="responseView"></code>
      </div>
    </div>
    <el-dialog v-model="addDialogVisible" title="新增" :width="700">
      <el-form ref="addFormRef" v-if="addDialogVisible" :model="addForm" :rules="rules" label-width="100px">
        <el-form-item label="method">
          <el-radio-group v-model="addForm.method" prop="method">
            <el-radio label="get" disabled>GET</el-radio>
            <el-radio label="put" disabled>PUT</el-radio>
            <el-radio label="post">POST</el-radio>
            <el-radio label="delete" disabled>DELETE</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="url" prop="url">
          <el-input v-model="addForm.url"></el-input>
        </el-form-item>
        <el-form-item label="response" prop="response">
          <el-input type="textarea" :rows="8" v-model="addForm.response"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="addConfirm(addFormRef)">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog v-model="singleProxyVisible" title="单服务代理" :width="900">
      <div class="singleProxyUtils">
        <el-button type="primary" @click="addSingleProxy">Add</el-button>
        <el-button type="danger" @click="clearSingleProxy">Clear</el-button>
      </div>
      <div class="singleProxyList">
        <div class="item" v-for="(item, index) in singleProxyList" :key="index">
          <div class="server">
            <span class="label">服务：</span>
            <el-input v-model="item.server"></el-input>
          </div>
          <div class="target">
            <span class="label">目标地址：</span>
            <el-input v-model="item.target" style="width: 350px;"></el-input>
          </div>
          <div class="switch">
            <el-switch v-model="item.open" />
          </div>
          <label for="" class="delete" @click="delSingleProxy(index)">删除</label>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="singleProxyVisible = false">Cancel</el-button>
          <el-button type="primary" @click="submitSingleProxy">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
const apiUrl = `http://localhost:3000`
const proxyTarget = ref('')
const proxyLoading = ref(true)

const getUpdateProxyUrl = (data) => {
  proxyTarget.value = data?.proxyUrl
  proxyLoading.value = false
}

const getProxyUrl = () => {
  axios.get(`${apiUrl}/server/global/proxy`).then(res => {
    if (+res.data?.code === 200) {
      proxyTarget.value = res.data.data
      proxyLoading.value = false
    }
  })
}

const init = () => {
  setTimeout(() => {
    getProxyUrl()
    getApiList()
  }, 200)
}

onMounted(() => {
  setTimeout(() => {
    window.$ipcRenderer.on('message-to-renderer', (event, message) => {
      try {
        const {type, code, data} = JSON.parse(message)
        if (type === 'event' && +code === 200) {
          // proxy event
          getUpdateProxyUrl(data)
          setTimeout(() => {
            getApiList()
            getProxyUrl()
          }, 500);
        }
      } catch (e) {
        proxyLoading.value = false
        console.warn(e)
      }
    });
  }, 500)
  init()
})

const apply = () => {
  proxyLoading.value = true
  window.$ipcRenderer.send('change-proxy-ip', proxyTarget.value);
}

const apiConfig = reactive({
  list: [],
  loading: false,
  example: ''
})
function getApiList() {
  axios.get(`${apiUrl}/server/apiList`).then(res => {
    if (+res.data?.code === 200) {
      apiConfig.list = res.data?.data.map(d => {
        return {
          url: d.url,
          response: d.response,
          active: false
        }
      })
      apiConfig.list?.length && clickApi(apiConfig.list[0])
    }
  })
}
const responseView = ref('')
const clickApi = (api) => {
  apiConfig.list.forEach(d => {
    d.active = d.url === api.url
  })
  responseView.value = JSON.stringify(api.response, null, 2)
}
// 重置到初始化接口mock
const reset = () => {
  window.$ipcRenderer.send('api-mock-reset', 'post');
}

// dialog 
const addDialogVisible = ref(false)
const addFormRef = ref(null)
let addForm = reactive({
  method: 'post',
  url: '',
  response: ''
})
const rules = reactive({
  method: [{required: true, message: 'please click method', trigger: 'blur'}],
  url: [{required: true, message: 'please input url', trigger: 'blur'}],
  response: [{required: true, message: 'please input response', trigger: 'blur'}],
})
const add = () => {
  addDialogVisible.value = true
  addForm.url = ''
  addForm.response = ''
}
const edit = () => {
  addDialogVisible.value = true
  const apiMap = apiConfig.list.find(d => d.active)
  addForm.url = apiMap?.url
  addForm.response = JSON.stringify(apiMap?.response, null, 2)
}
const addConfirm = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      try {
        const response = JSON.parse(addForm.response)
         axios.post(`${apiUrl}/server/api/add`, {...addForm, responseMap: response}).then(res => {
          if (+res.data?.code === 200) {
            ElMessage.success(`操作成功`)
            addDialogVisible.value = false
            window.$ipcRenderer.send('api-mock-restart', 'restart');
          }
         })
      } catch(e) {
        console.warn(e)
        ElMessage.error(`JSON格式错误`)
      }
    } else {
      console.log('error submit!', fields)
    }
  })
}

// single proxy
const singleProxyVisible = ref(false)
let singleProxyList = ref([])
const openSingleProxy = () => {
  axios.get(`${apiUrl}/server/api/singleProxy`).then(res => {
    if (+res.data?.code === 200) {
      const resMap = res.data.data || {}
      singleProxyList.value = Object.keys(resMap).map(key => {
        return {
          server: key,
          target: resMap[key].target,
          open: resMap[key].open
        }
      })
      singleProxyVisible.value = true
    } else {
      ElMessage.error(`服务器开小差了`)
    }
  })
}
const delSingleProxy = (index) => {
  singleProxyList.value.splice(index, 1)
}
const addSingleProxy = () => {
  singleProxyList.value.push({server: 'mes-xxxx', target: '', open: false})
}
const clearSingleProxy = () => {
  singleProxyList.value = []
}
const submitSingleProxy = () => {
  const filterRes = {}
  singleProxyList.value.forEach(d => {
    const key = d.server.replace(/\s/g, '')
    const val = d.target.replace(/\s/g, '')
    if (!val) return
    filterRes[key] = {target: val, open: d.open}
  })
  axios.post(`${apiUrl}/server/api/singleProxy`, {singleProxyMap: filterRes}).then(res => {
    if (+res.data?.code === 200) {
      ElMessage.success(`操作成功`)
      singleProxyVisible.value = false
      window.$ipcRenderer.send('api-mock-restart', 'restart');
    }
  })
}


</script>

<style scoped lang="scss">
.MockClient{
  .header{
    display: flex;
    align-items: center;
    padding: 20px 24px 0;
    .serverIp{
      width: 240px;
      height: 32px;
      font-size: 16px;
      text-indent: 10px;
    }
    .proxyBtn{
      margin-left: 20px;
      
    }
  }
  .apiList{
    padding: 20px 24px 0;
    height: 500px;
    display: flex;
    .apis{
      height: 100%;
      width: 400px;
      overflow-y: auto;
      .api{
        margin-bottom: 5px;
        padding: 4px 10px;
        background: #ecf5ff;
        border-radius: 5px;
        color: #282828;
        cursor: pointer;
        word-break: break-all;
        &:hover, &.active{
          background: #40b9ff;
        }
      }
    }
    .responseView{
      margin-left: 20px;
      width: 500px;
      max-width: 500px;
      padding: 10px;
      background: #fff;
      border: 1px solid #ddd;
      overflow-y: auto;
      color: #282828;
    }
  }
  .singleProxyUtils{
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 10px;
  }
  .singleProxyList{
    height: 300px;
    .item{
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      &:last-of-type{
        margin-bottom: 0;
      }
      .delete{
        margin-left: 5px;
        min-width: 30px;
        cursor: pointer;
        color: #40b9ff;
      }
      .server, .target{
        .label{
          min-width: 80px;
          text-align: right;
        }
        display: flex;
        align-items: center;
      }
      .switch{
        margin-left: 10px;
      }
    }
  }
}
</style>
