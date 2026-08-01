import ManagersOpeningChecklistForm from './ManagersOpeningChecklistForm.jsx'

const WAYNESVILLE_ITEMS = [
  { key: 'Open Sign On', label: 'Open Sign On', yesUpload: true },
  { key: 'All Doors Unlocked', label: 'All Doors Unlocked', yesPrompt: 'Who unlocked them?' },
  { key: 'Lamps/Kiosks On', label: 'Lamps/Kiosks On', yesPrompt: 'Who turned them on?' },
  { key: 'Bathrooms Checked & Stocked', label: 'Bathrooms Checked & Stocked', yesPrompt: 'Who checked them, any suggestions?' },
  { key: 'Music On', label: 'Music On', yesPrompt: 'Who turned them on?' },
]

function ManagersOpeningChecklistWaynesville() {
  return (
    <ManagersOpeningChecklistForm
      title="MANAGERS OPENING CHECKLIST WAYNESVILLE"
      formKey="managers-opening-checklist-waynesville"
      checklistItems={WAYNESVILLE_ITEMS}
    />
  )
}

export default ManagersOpeningChecklistWaynesville
