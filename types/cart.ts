export interface CartProduct {
    id: string
    name: string
    quantity: number
    price_aed?: number
  }
  
  export interface CartOptions {
    showToast?: boolean
    clearSession?: boolean
    onSuccess?: () => void
    onError?: (error: Error) => void
  }
  
  export interface CartResponse {
    success: boolean
    data?: any
    error?: Error
    count?: number
  }
  
  export interface AssessmentData {
    profile: any
    totalIntake: any
    deficits: any
    recommendations?: CartProduct[]
    timestamp?: number
  }