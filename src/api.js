const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/+$/, '')

const parseResponse = async (response) => {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (!isJson) {
    const text = await response.text()
    throw new Error(
      `Expected JSON but got ${response.status} ${response.statusText}. ` +
      `Is the backend running at ${API_BASE}?`
    )
  }

  return response.json()
}

const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`

  const headers = new Headers(options.headers || {})
  const accessFromStorage = localStorage.getItem('accessToken')
  if (accessFromStorage) headers.set('Authorization', `Bearer ${accessFromStorage}`)
  // Debug: log whether Authorization header is present (masked)
  try {
    const authHeader = headers.get('Authorization')
    if (authHeader) {
      const preview = authHeader.length > 20 ? authHeader.slice(0, 20) + '...' : authHeader
      console.debug('apiFetch', endpoint, 'Authorization present: true, preview:', preview)
    } else {
      console.debug('apiFetch', endpoint, 'Authorization present: false')
    }
  } catch (e) {
    console.debug('apiFetch', endpoint, 'Authorization check error', e)
  }
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  // initial request
  let response = await fetch(url, { ...options, headers })

  // If unauthorized (access token expired), try refreshing the access token once and retry
  if (response.status === 401) {
    const refresh = localStorage.getItem('refreshToken')
    if (refresh) {
      try {
        const refreshResp = await fetch(`${API_BASE}/shop/refresh-token/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh }),
        })

        if (refreshResp.ok) {
          const refreshData = await parseResponse(refreshResp)
          const newAccess = refreshData?.access
          if (newAccess) {
            setTokens(newAccess, refresh)
            headers.set('Authorization', `Bearer ${newAccess}`)
            response = await fetch(url, { ...options, headers })
          }
        } else {
          clearTokens()
        }
      } catch (err) {
        console.error('Refresh token request failed', err)
        clearTokens()
      }
    }
  }

  const data = await parseResponse(response)

  if (!response.ok) {
    console.error(data)
    throw new Error(JSON.stringify(data))
  }

  return data
}

export const getAdminProducts = () => {
  if (!localStorage.getItem('accessToken')) return
  return apiFetch('/shop/admin/products/')
}

export const createAdminProduct = (productData) => {
  return apiFetch('/shop/admin/products/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(productData),
  })
}

export const updateProduct = (productId, productData) => {
  return apiFetch(`/shop/admin/products/${productId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(productData),
  })
}

export const deleteProduct = (productId) => {
  return apiFetch(`/shop/admin/products/${productId}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  })
}

export const sendCodeApi = (mobile) => {
  return apiFetch('/shop/send-code/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mobile }),
  })
}

export const verifyCodeApi = (mobile, otp) => {
  return apiFetch('/shop/verify-code/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mobile, otp }),
  })
}

export const refreshTokenApi = (refresh) => {
  return apiFetch('/shop/refresh-token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  })
}

export function setTokens(access, refresh) {
  localStorage.setItem('accessToken', access)
  localStorage.setItem('refreshToken', refresh)
}

export function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export const adminLogin = (mobile, password) => {
  return apiFetch('/shop/admin/login/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },  
    body: JSON.stringify({ mobile, password }),
  })
}

export const createDiscount = (data) => {
  return apiFetch('/shop/admin/discounts/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  })
}

export const updateDiscount = (discountId, data) => {
  return apiFetch(`/shop/admin/discounts/${discountId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  })
}

export const deleteDiscount = (discountId) => {
  return apiFetch(`/shop/admin/discounts/${discountId}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  })
}

export const getProductCategories = () => {
  return apiFetch('/shop/admin/products/categories/')
}

export const getPublicProducts = () => {
  return apiFetch('/shop/products/')
}

export const getPublicProductDetails = (productId) => {
  return apiFetch(`/shop/products/${productId}/`)
}

export const getProfile = () => apiFetch('/shop/profile/')

export const updateProfile = (data) =>
  apiFetch('/shop/profile/', {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const createOrder = (data) =>
  apiFetch('/shop/orders/', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getCustomerOrders = () => apiFetch('/shop/orders/')

export const getOrderDetails = (orderId) => apiFetch(`/shop/orders/${orderId}/pay/`)

export const payOrderApi = (orderId) =>
  apiFetch(`/shop/orders/${orderId}/pay/`, {
    method: 'POST',
  })

