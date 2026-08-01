import ManagersClosingChecklistForm from './ManagersClosingChecklistForm.jsx'

const WAYNESVILLE_ITEMS = [
  "'OPEN' Sign Off",
  'All Quote Sheets Completed And Checked',
  'Music Off',
  'Lamps Off',
  'Bathrooms Checked',
  'Bars on Fire Doors in locked positions',
  'Tablets Charging',
  'Scan Gun Uploaded and Charging',
  'All Scan Files Interfaced or Deleted',
  'DT P2 Has No Scheduled Pick Ups',
  'Cash Drawer Collected and In Safe',
  'UPS Report Sent To Management',
  'All Doors Locked and Alarm To Be Armed',
  'All BAY doors closed chained',
]

function ManagersClosingChecklistWaynesville() {
  return (
    <ManagersClosingChecklistForm
      title="MANAGERS CLOSING CHECKLIST WAYNESVILLE"
      formKey="managers-closing-checklist-waynesville"
      checklistItems={WAYNESVILLE_ITEMS}
      noPickupsItem="DT P2 Has No Scheduled Pick Ups"
    />
  )
}

export default ManagersClosingChecklistWaynesville
