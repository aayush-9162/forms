import ManagersOpeningChecklistForm from './ManagersOpeningChecklistForm.jsx'

const ARDEN_ITEMS = [
  { key: 'Open Sign On', label: 'Open Sign On', yesUpload: true },
  { key: 'All Doors Unlocked', label: 'All Doors Unlocked', yesPrompt: 'Who unlocked them?' },
  { key: "Lamps/TV's/Kiosks On", label: "Lamps/TV's/Kiosks On", yesPrompt: 'Who turned them on?' },
  { key: "Line 8/Line 9 PC's Turned On", label: "Line 8/Line 9 PC's Turned On", yesPrompt: 'Who turned them on?' },
  { key: 'Hallway Lights On', label: 'Hallway Lights On', yesPrompt: 'Who turned them on?' },
  { key: 'Bathrooms Checked', label: 'Bathrooms Checked', yesPrompt: 'Who checked them, any suggestions?' },
  { key: 'Music On', label: 'Music On', yesPrompt: 'Who turned them on?' },
]

function ManagersOpeningChecklistArden() {
  return (
    <ManagersOpeningChecklistForm
      title="MANAGERS OPENING CHECKLIST ARDEN"
      formKey="managers-opening-checklist-arden"
      checklistItems={ARDEN_ITEMS}
    />
  )
}

export default ManagersOpeningChecklistArden
