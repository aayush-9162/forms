import { useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import RadioQuestion, { OTHER_VALUE } from '../../components/RadioQuestion.jsx'
import GridQuestion from '../../components/GridQuestion.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { todayIso } from '../../lib/dates.js'

const FORM_KEY = 'warehouse-closing-checklist'

const LINE_UP_ITEMS = [
  'All Items Show In OT except scheduled pickup.',
  'In Proper Order',
  'All Pieces Present',
  'Every Piece Inspected For Damage',
  'Video Completed/Uploaded',
]

const DISPATCH_TRACK_ITEMS = [
  'Routes Locked',
  'Uploaded To RV',
  'RV/DT Routes Match',
  'All Notifications Confirmed',
  'P/P1 Shows All Jobs Finished',
  'Next Route info sent to managers',
]

const ELECTRONIC_DEVICES_ITEMS = [
  'Scanner Guns Uploaded/Interfaced/Posted/Charging',
  '2 Samsung Tablets Charging',
  'Laptop Charging',
  'Walkie Talkies Charging (8)',
  'Sweeper Charging',
]

const WAREHOUSE_ITEMS = [
  'Gates Locked',
  'Thermostat Adjusted',
  'Lights Off',
  'Alarm Ready To Arm',
]

const GRID_COLS_WITH_NA = ['Yes', 'No', 'See Comment', 'NA']
const GRID_COLS_NO_NA = ['Yes', 'No', 'See Comment']

const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => String(start + i))

function WarehouseClosingChecklist() {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [name, setName] = useDraftState(`${FORM_KEY}.name`, '')
  const [nameOther, setNameOther] = useDraftState(`${FORM_KEY}.nameOther`, '')
  const [trucksReceived, setTrucksReceived] = useDraftState(`${FORM_KEY}.trucksReceived`, '')
  const [paperworkCompleted, setPaperworkCompleted] = useDraftState(`${FORM_KEY}.paperworkCompleted`, '')
  const [piecesInRoute, setPiecesInRoute] = useDraftState(`${FORM_KEY}.piecesInRoute`, '')
  const [stopsInRoute, setStopsInRoute] = useDraftState(`${FORM_KEY}.stopsInRoute`, '')
  const [trucksScheduled, setTrucksScheduled] = useDraftState(`${FORM_KEY}.trucksScheduled`, '')
  const [nextDayDelivery, setNextDayDelivery] = useDraftState(`${FORM_KEY}.nextDayDelivery`, '')
  const [ardenPickup, setArdenPickup] = useDraftState(`${FORM_KEY}.ardenPickup`, '')
  const [waynesvillePickup, setWaynesvillePickup] = useDraftState(`${FORM_KEY}.waynesvillePickup`, '')
  const [lineUp, setLineUp] = useDraftState(`${FORM_KEY}.lineUp`, {})
  const [lineUpComments, setLineUpComments] = useDraftState(`${FORM_KEY}.lineUpComments`, '')
  const [dispatchTrack, setDispatchTrack] = useDraftState(`${FORM_KEY}.dispatchTrack`, {})
  const [dispatchTrackComments, setDispatchTrackComments] = useDraftState(`${FORM_KEY}.dispatchTrackComments`, '')
  const [electronicDevices, setElectronicDevices] = useDraftState(`${FORM_KEY}.electronicDevices`, {})
  const [warehouse, setWarehouse] = useDraftState(`${FORM_KEY}.warehouse`, {})
  const [comments, setComments] = useDraftState(`${FORM_KEY}.comments`, '')
  const [timeClockedOut, setTimeClockedOut] = useDraftState(`${FORM_KEY}.timeClockedOut`, '')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const gridChange = (setter) => (row, col) =>
    setter((prev) => ({ ...prev, [row]: col }))

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        name: name === OTHER_VALUE ? nameOther : name,
        trucks_received: trucksReceived,
        paperwork_completed: paperworkCompleted,
        pieces_in_route: piecesInRoute,
        stops_in_route: stopsInRoute,
        trucks_scheduled: trucksScheduled,
        next_day_delivery: nextDayDelivery,
        arden_pickup: ardenPickup,
        waynesville_pickup: waynesvillePickup,
        line_up: lineUp,
        line_up_comments: lineUpComments,
        dispatch_track: dispatchTrack,
        dispatch_track_comments: dispatchTrackComments,
        electronic_devices: electronicDevices,
        warehouse,
        comments,
        time_clocked_out: timeClockedOut,
      },
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setName('')
    setNameOther('')
    setTrucksReceived('')
    setPaperworkCompleted('')
    setPiecesInRoute('')
    setStopsInRoute('')
    setTrucksScheduled('')
    setNextDayDelivery('')
    setArdenPickup('')
    setWaynesvillePickup('')
    setLineUp({})
    setLineUpComments('')
    setDispatchTrack({})
    setDispatchTrackComments('')
    setElectronicDevices({})
    setWarehouse({})
    setComments('')
    setTimeClockedOut('')
    reset()
  }

  return (
    <FormShell
      title="Warehouse Closing Checklist"
      submitted={submitted}
      queued={queued}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onReset={handleReset}
    >
      <FormRow>
        <FormField label="Email" hint="Auto-filled from your Google account.">
          <input
            type="email"
            readOnly
            value={user?.email || ''}
            className={`${inputClass} bg-slate-50 cursor-not-allowed`}
          />
        </FormField>

        <FormField label="Date" required>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormRow>
        <RadioQuestion
          label="Name"
          required
          name="name"
          options={['Chris Metlab', 'Justin']}
          value={name}
          onChange={setName}
          allowOther
          otherValue={nameOther}
          onOtherChange={setNameOther}
        />

        <FormField label="Time clocked out" required>
          <input
            type="time"
            required
            value={timeClockedOut}
            onChange={(e) => setTimeClockedOut(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <RadioQuestion
        label="# Trucks Received Today"
        required
        horizontal
        name="trucksReceived"
        options={range(0, 9)}
        value={trucksReceived}
        onChange={setTrucksReceived}
      />

      <RadioQuestion
        label="Receiving Paperwork Completed/Bagged"
        required
        name="paperworkCompleted"
        options={['Yes', 'No', 'NA']}
        value={paperworkCompleted}
        onChange={setPaperworkCompleted}
      />

      <FormRow>
        <FormField label="# Pieces In Route" required>
          <input
            type="number"
            required
            value={piecesInRoute}
            onChange={(e) => setPiecesInRoute(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="# Stops In Route" required>
          <input
            type="number"
            required
            value={stopsInRoute}
            onChange={(e) => setStopsInRoute(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <RadioQuestion
        label="# Trucks Scheduled"
        required
        horizontal
        name="trucksScheduled"
        options={['T 1', 'T 2', 'T 3', 'T 4', 'T 5']}
        value={trucksScheduled}
        onChange={setTrucksScheduled}
      />

      <RadioQuestion
        label="Next Day Delivery"
        required
        name="nextDayDelivery"
        options={['Yes', 'No']}
        value={nextDayDelivery}
        onChange={setNextDayDelivery}
      />

      <RadioQuestion
        label="# Pieces In Route At Arden Scheduled For Pickup"
        required
        horizontal
        name="ardenPickup"
        options={range(0, 10)}
        value={ardenPickup}
        onChange={setArdenPickup}
      />

      <RadioQuestion
        label="# Pieces In Route At Waynesville Scheduled For Pickup"
        required
        horizontal
        name="waynesvillePickup"
        options={range(0, 10)}
        value={waynesvillePickup}
        onChange={setWaynesvillePickup}
      />

      <GridQuestion
        label="Line Up"
        required
        rows={LINE_UP_ITEMS}
        columns={GRID_COLS_WITH_NA}
        values={lineUp}
        onChange={gridChange(setLineUp)}
      />

      <FormField label="Line Up Comments">
        <textarea
          rows="3"
          value={lineUpComments}
          onChange={(e) => setLineUpComments(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <GridQuestion
        label="Dispatch Track"
        required
        rows={DISPATCH_TRACK_ITEMS}
        columns={GRID_COLS_WITH_NA}
        values={dispatchTrack}
        onChange={gridChange(setDispatchTrack)}
      />

      <FormField label="Dispatch Track Comments">
        <textarea
          rows="3"
          value={dispatchTrackComments}
          onChange={(e) => setDispatchTrackComments(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <GridQuestion
        label="Electronic Devices"
        required
        rows={ELECTRONIC_DEVICES_ITEMS}
        columns={GRID_COLS_NO_NA}
        values={electronicDevices}
        onChange={gridChange(setElectronicDevices)}
      />

      <GridQuestion
        label="Warehouse"
        required
        rows={WAREHOUSE_ITEMS}
        columns={GRID_COLS_NO_NA}
        values={warehouse}
        onChange={gridChange(setWarehouse)}
      />

      <FormField label="Comments">
        <textarea
          rows="3"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default WarehouseClosingChecklist
