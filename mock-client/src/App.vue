<template>
  <div class="MockClient">
    <header class="header">
      <h3 style="min-width: 80px;">代理地址</h3>
      <el-input v-model="proxyTarget" placeholder="请输入代理ip" style="width: 240px;margin-right: 10px;"></el-input>
      <el-button :loading="proxyLoading" @click="apply" type="primary">Apply</el-button>
      <el-button type="primary" plain @click="add">Add</el-button>
      <el-button type="primary" plain @click="edit">Edit</el-button>
      <el-button @click="reset" type="danger" :loading="proxyLoading">Reset</el-button>
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
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
const apiUrl = `http://localhost:3000`
const proxyTarget = ref('http://guava.ob.shuyilink.com')
const proxyLoading = ref(false)

const getUpdateProxyUrl = (data) => {
  proxyTarget.value = data?.proxyUrl
  proxyLoading.value = false
}

const init = () => {
  getApiList()
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
          }, 200);
        }
      } catch (e) {
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
      width: 450px;
      max-width: 450px;
      padding: 10px;
      background: #fff;
      border: 1px solid #ddd;
      overflow-y: auto;
      color: #282828;
    }
  }
}
</style>
