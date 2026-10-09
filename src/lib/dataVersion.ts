import { createContext, useContext } from 'react'

/** Bumped after a write (e.g. a transfer in the sheet), so pages behind it reload their data. */
export const DataVersionContext = createContext<{ version: number; bump: () => void }>({ version: 0, bump: () => {} })

export const useDataVersion = () => useContext(DataVersionContext)
