import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Login from './components/Login.jsx'
import Home from './pages/Home.jsx'
import CashReceivedArden from './pages/forms/CashReceivedArden.jsx'
import ManagersOpeningChecklistArden from './pages/forms/ManagersOpeningChecklistArden.jsx'
import ManagersClosingChecklistArden from './pages/forms/ManagersClosingChecklistArden.jsx'
import WarehouseNotification from './pages/forms/WarehouseNotification.jsx'
import WarehouseOpeningChecklist from './pages/forms/WarehouseOpeningChecklist.jsx'
import WarehouseClosingChecklist from './pages/forms/WarehouseClosingChecklist.jsx'
import PartReceived from './pages/forms/PartReceived.jsx'
import DeliveryChecklist from './pages/forms/DeliveryChecklist.jsx'
import PreDeliveryChecklist from './pages/forms/PreDeliveryChecklist.jsx'
import CashReceivedWvl from './pages/forms/CashReceivedWvl.jsx'
import ManagersOpeningChecklistWaynesville from './pages/forms/ManagersOpeningChecklistWaynesville.jsx'
import ManagersClosingChecklistWaynesville from './pages/forms/ManagersClosingChecklistWaynesville.jsx'
import ToDoList from './pages/forms/ToDoList.jsx'
import HotButtonStatusCallAlert from './pages/forms/HotButtonStatusCallAlert.jsx'
import CustomerServiceRequest from './pages/forms/CustomerServiceRequest.jsx'

// Sign in with Google gates the whole app: no valid credential → login screen.
// Every account that reaches the routes is a verified @123cfc.com user (the
// domain check is enforced server-side on every request).

function App() {
  const { user } = useAuth()

  if (!user) return <Login />

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/forms/cash-received-arden" element={<CashReceivedArden />} />
          <Route path="/forms/managers-opening-checklist-arden" element={<ManagersOpeningChecklistArden />} />
          <Route path="/forms/managers-closing-checklist-arden" element={<ManagersClosingChecklistArden />} />
          <Route path="/forms/warehouse-notification" element={<WarehouseNotification />} />
          <Route path="/forms/warehouse-opening-checklist" element={<WarehouseOpeningChecklist />} />
          <Route path="/forms/warehouse-closing-checklist" element={<WarehouseClosingChecklist />} />
          <Route path="/forms/part-received" element={<PartReceived />} />
          <Route path="/forms/delivery-checklist" element={<DeliveryChecklist />} />
          <Route path="/forms/pre-delivery-checklist" element={<PreDeliveryChecklist />} />
          <Route path="/forms/cash-received-wvl" element={<CashReceivedWvl />} />
          <Route path="/forms/managers-opening-checklist-waynesville" element={<ManagersOpeningChecklistWaynesville />} />
          <Route path="/forms/managers-closing-checklist-waynesville" element={<ManagersClosingChecklistWaynesville />} />
          <Route path="/forms/to-do-list" element={<ToDoList />} />
          <Route path="/forms/hot-button-status-call-alert" element={<HotButtonStatusCallAlert />} />
          <Route path="/forms/customer-service-request" element={<CustomerServiceRequest />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
