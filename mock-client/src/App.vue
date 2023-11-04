<template>
  <div class="MockClient">
    <header class="header">
      <h3 style="min-width: 80px;">代理地址</h3>
      <el-input v-model="proxyTarget" placeholder="请输入代理ip" style="width: 240px;margin-right: 10px;"></el-input>
      <el-button :loading="proxyLoading" @click="apply" type="primary">Apply</el-button>
    </header>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const proxyTarget = ref('http://guava.ob.shuyilink.com')
const proxyLoading = ref(false)

const getUpdateProxyUrl = (data) => {
  proxyTarget.value = data?.proxyUrl
  proxyLoading.value = false
}

onMounted(() => {
  setTimeout(() => {
    window.$ipcRenderer.on('message-to-renderer', (event, message) => {
      try {
        const {type, code, data} = JSON.parse(message)
        if (type === 'event' && +code === 200) {
          // proxy event
          getUpdateProxyUrl(data)
        }
      } catch{}
    });
  }, 500)
})

const apply = () => {
  proxyLoading.value = true
  window.$ipcRenderer.send('change-proxy-ip', proxyTarget.value);
}

</script>

<style scoped lang="scss">
.MockClient{
  .header{
    display: flex;
    align-items: center;
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
}
</style>
