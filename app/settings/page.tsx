export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center p-8">
      <div className="w-full max-w-3xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Settings
          </h1>
          <p className="text-slate-600 mt-2">
            Configure global settings like quiet hours and default provider.
          </p>
        </header>

        <section className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Quiet Hours</h2>
          <form className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-slate-600 mb-1" htmlFor="quietStart">
                  Start (HH:MM)
                </label>
                <input
                  id="quietStart"
                  type="time"
                  className="border rounded px-2 py-1"
                  defaultValue="21:00"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-slate-600 mb-1" htmlFor="quietEnd">
                  End (HH:MM)
                </label>
                <input
                  id="quietEnd"
                  type="time"
                  className="border rounded px-2 py-1"
                  defaultValue="07:00"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-slate-600 mb-1" htmlFor="provider">
                Default Provider
              </label>
              <select
                id="provider"
                className="border rounded px-2 py-1"
                defaultValue="twilio"
              >
                <option value="twilio">Twilio</option>
                <option value="other">Other (coming soon)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded"
            >
              Save (not wired yet)
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
