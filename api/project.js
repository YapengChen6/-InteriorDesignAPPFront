import request from '@/utils/request'

// 定义 baseURL - 根据后端控制器路径
const baseURL = '/project'

/**
 * 项目API - 只保留后端实际存在的接口
 */
export const projectApi = {
  /**
   * 新增项目
   * @param {Object} projectDTO 项目数据
   * @returns {Promise}
   */
  save(projectDTO) {
    return request({
      url: baseURL, // POST /project
      method: 'post',
      data: projectDTO,
      loading: true
    })
  },

  /**
   * 查询项目列表
   * @param {Object} params 查询参数
   * @returns {Promise}
   */
  getList(params) {
    return request({
      url: `${baseURL}/list`, // GET /project/list
      method: 'get',
      params: params,
      loading: true
    })
  },

  /**
   * 删除项目
   * @param {Number} projectId 项目ID
   * @returns {Promise}
   */
  delete(projectId) {
    return request({
      url: baseURL, // DELETE /project?projectId=xxx
      method: 'delete',
      // 使用 params 传递，避免后端 MissingServletRequestParameterException
      params: { projectId },
      loading: true
    })
  },

  /**
   * 修改项目
   * @param {Object} projectDTO 项目数据
   * @returns {Promise}
   */
  update(projectDTO) {
    return request({
      url: baseURL, // PUT /project
      method: 'put',
      data: projectDTO,
      loading: true
    })
  },

  /**
   * 更新项目状态 - 修正：使用params而不是data
   * @param {Number} projectId 项目ID
   * @param {Number} status 状态值
   * @returns {Promise}
   */
  updateStatus(projectId, status) {
    return request({
      url: `${baseURL}/updateStatus`,
      method: 'put',
      params: {  // 使用 params 而不是 data
        projectId: projectId,
        status: status
      },
      loading: true
    })
  }
}

/**
 * 项目服务
 */
export const projectService = {
  /**
   * 创建项目
   * @param {Object} projectData 项目数据
   * @returns {Promise}
   */
  async createProject(projectData) {
    try {
      const res = await projectApi.save(projectData)
      if (res.code === 200 || res.success) {
        return Promise.resolve(res.data || res.result)
      } else {
        const errorMsg = res.msg || res.message || '创建项目失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('创建项目异常:', error)
      if (error.errMsg && error.errMsg.includes('request:fail')) {
        throw new Error('网络连接失败，请检查网络设置')
      }
      throw error
    }
  },

  /**
   * 获取项目分页列表
   * @param {Object} queryParams 查询参数
   * @returns {Promise}
   */
  async getProjectList(queryParams = {}) {
    try {
      // 修复参数映射 - 使用后端正确的参数名
      const params = {
        // 项目查询参数映射
        title: queryParams.title,
        status: queryParams.status,
        address: queryParams.address,
        deadline: queryParams.deadline,
        // 用户过滤
        userId: queryParams.userId,
        roleType: queryParams.roleType,
        // 修复预算参数名 - 使用后端需要的参数名
        budgetMin: queryParams.budgetMin,
        budgetMax: queryParams.budgetMax,
        // 分页参数
        pageNum: queryParams.pageNum || 1,
        pageSize: queryParams.pageSize || 10
      }
      
      // 过滤空值参数
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] == null || params[key] === undefined) {
          delete params[key]
        }
      })
      
      console.log('🎯 Service层请求参数:', params)
      
      const res = await projectApi.getList(params)
      
      // 根据后端返回格式调整
      if (res.code === 200 || res.success) {
        console.log('✅ Service层返回数据:', res.data || res.result)
        return Promise.resolve(res.data || res.result || [])
      } else {
        const errorMsg = res.msg || res.message || '获取项目列表失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('❌ 获取项目列表异常:', error)
      throw error
    }
  },

  /**
   * 获取项目详情 - 由于后端缺少详情接口，这里从列表数据中查找
   * @param {Number} projectId 项目ID
   * @returns {Promise}
   */
  async getProjectDetail(projectId) {
    try {
      // 从项目列表中查找对应项目
      const listRes = await projectApi.getList({})
      if (listRes.code === 200 || listRes.success) {
        const projectList = listRes.data?.records || listRes.data || listRes.result || []
        const project = projectList.find(item => item.projectId == projectId || item.id == projectId)
        if (project) {
          return Promise.resolve(project)
        }
      }
      
      throw new Error('未找到项目详情')
      
    } catch (error) {
      console.error('获取项目详情异常:', error)
      throw error
    }
  },

  /**
   * 更新项目
   * @param {Object} projectData 项目数据
   * @returns {Promise}
   */
  async updateProject(projectData) {
    try {
      const res = await projectApi.update(projectData)
      if (res.code === 200 || res.success) {
        return Promise.resolve(res.data || res.result)
      } else {
        const errorMsg = res.msg || res.message || '更新项目失败'
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('更新项目异常:', error)
      throw error
    }
  },

  /**
   * 更新项目状态
   * @param {Number} projectId 项目ID
   * @param {Number} status 状态值
   * @returns {Promise}
   */
  async updateProjectStatus(projectId, status) {
    try {
      console.log('🔄 更新项目状态 - 调用接口:', { projectId, status })
      
      const res = await projectApi.updateStatus(projectId, status)
      console.log('📡 状态更新接口响应:', res)
      
      if (res.code === 200 || res.success) {
        console.log('✅ 状态更新成功')
        return Promise.resolve(res.data || res.result)
      } else {
        const errorMsg = res.msg || res.message || '更新状态失败'
        console.error('❌ 状态更新失败:', errorMsg)
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      console.error('❌ 更新项目状态异常:', error)
      throw error
    }
  },

  /**
   * 删除项目
   * @param {Number} projectId 项目ID
   * @returns {Promise}
   */
  async deleteProject(projectId) {
    try {
      return new Promise((resolve, reject) => {
        uni.showModal({
          title: '提示',
          content: '确定要删除该项目吗？',
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await projectApi.delete(projectId)
                if (result.code === 200 || result.success) {
                  resolve(result.data || result.result)
                } else {
                  const errorMsg = result.msg || result.message || '删除失败'
                  reject(new Error(errorMsg))
                }
              } catch (error) {
                reject(error)
              }
            } else {
              reject(new Error('用户取消'))
            }
          }
        })
      })
    } catch (error) {
      return Promise.reject(error)
    }
  },

  /**
   * 接取项目并更新状态
   * @param {Object} acceptData 接单数据
   * @returns {Promise}
   */
  async acceptProject(acceptData) {
    try {
      const { projectId, status, acceptedBy, acceptedRole } = acceptData
      
      console.log('🎯 接取项目 - 参数:', { projectId, status, acceptedBy, acceptedRole })
      
      // 直接调用更新状态接口
      const result = await this.updateProjectStatus(projectId, status)
      
      console.log('✅ 接单成功:', result)
      return Promise.resolve(result)
    } catch (error) {
      console.error('❌ 接取项目异常:', error)
      throw error
    }
  }
}