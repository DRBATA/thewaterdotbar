import StockAddition from '@/components/StockAddition'

export default function StaffStockPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
        <p className="text-gray-600 mt-2">Add, update, and manage product inventory</p>
      </div>
      <StockAddition />
    </div>
  )
}
