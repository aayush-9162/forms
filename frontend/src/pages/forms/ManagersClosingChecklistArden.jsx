import ManagersClosingChecklistForm from './ManagersClosingChecklistForm.jsx'

const ARDEN_ITEMS = [
  "'OPEN' Sign Off",
  'All Quote Sheets Completed And Checked',
  'Cafe Clean and Stocked',
  'Music Off',
  "Lamps and TV's Off",
  '122 and 123 Shut Down',
  'Bathrooms Checked',
  'Hallway Lights Off',
  'R9/R8 Doors Closed/Lights Off',
  'Tablets Charging',
  'Scan Gun Uploaded and Charging',
  'All Scan Files Interfaced or Deleted',
  'DT P1 Has No Scheduled Pick Ups',
  'Cash Drawer Collected and In Safe',
  'UPS Report Sent To Management',
  'All Doors Locked and Alarm To Be Armed',
]

function ManagersClosingChecklistArden() {
  return (
    <ManagersClosingChecklistForm
      title="MANAGERS CLOSING CHECKLIST ARDEN"
      formKey="managers-closing-checklist-arden"
      checklistItems={ARDEN_ITEMS}
      noPickupsItem="DT P1 Has No Scheduled Pick Ups"
    />
  )
}

export default ManagersClosingChecklistArden
