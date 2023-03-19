import { ElMessage } from 'element-plus'

import { StrSignOk, StrSignErr } from '@/constants'
import { useAppStore } from '@/pinia/modules/app'
import { useSettingStore } from '@/pinia/modules/settings'
import { usePaneDataStore } from '@/pinia/modules/pane_data'
import { CmdInvoke } from '@/libs/commands'
import { stringToUint8Array } from '@/utils/string'
import { i18n } from '@/libs/init/i18n'
import { SyncUserData } from '@/libs/sync/sync_data'
import { getTimestampMilliseconds } from '@/utils/time'

import { parseNotebookJson } from './parser_decode'
import { saveNotebookFile, saveEntryFile, genNotebookFileContent, saveNotebookFileWithContent } from './parser_encode'
import { fileMeta } from './types_templates'

export const getEntryFileName = () => {
  const settingStore = useSettingStore()
  return settingStore.data.encryption.entryFileName
}

export const genCurrentNotebookFileName = () => {
  const settingStore = useSettingStore()
  const paneDataStore = usePaneDataStore()
  const hashedSign = paneDataStore.data.itemsColumn.hashedSign
  const senc = settingStore.data.encryption
  return `${hashedSign}${senc.fileExt}`
}

export const getNotebookFilePath = (hashedSign: string) => {
  const appStore = useAppStore()
  const settingStore = useSettingStore()
  const p = appStore.data.dataPath
  return p.pathOfCurrentDir + hashedSign + settingStore.data.encryption.fileExt
}

export const writeEncryptedUserDataToFile = (dir: string, fileName: string, content: string) => {
  const settingStore = useSettingStore()
  const mp = settingStore.data.encryption.masterPassword

  if (import.meta.env.TAURI_DEBUG) {
    console.log('>>> writeEncryptedUserDataToFile content:: ', content)
  }

  return CmdInvoke.writeUserDataFile(mp, dir + fileName, fileName, stringToUint8Array(JSON.stringify(content)), '')
}

export const readNotebookdata = async (hashedSign: string) => {
  const settingStore = useSettingStore()

  const data = await CmdInvoke.readUserDataFile(settingStore.data.encryption.masterPassword, getNotebookFilePath(hashedSign), true)
  if (data.file_data_str.length === 0) {
    console.log('>>> readNotebookdata readUserDataFile get empty content')
  }
  const notesData = JSON.parse(data.file_data_str)

  if (import.meta.env.TAURI_DEBUG) {
    console.log('>>> readNotebookdata notesData:: ', JSON.parse(notesData))
  }

  return parseNotebookJson(notesData) // call JSON.parse to get a JSON string
}

export const writeUserData = (filePath: string, fileName: string, fileContent: Uint8Array) => {
  const settingStore = useSettingStore()
  const mp = settingStore.data.encryption.masterPassword

  return CmdInvoke.writeUserDataFile(mp, filePath, fileName, fileContent, '')
}

export const updateFileMeta = async (dir: string, fileName: string) => {
  const appStore = useAppStore()
  const appData = appStore.data

  let meta = fileMeta
  if (Object.prototype.hasOwnProperty.call(appData.fileMetaMapping, fileName)) {
    meta = appData.fileMetaMapping[fileName]
  }
  meta.mtimeUtc = getTimestampMilliseconds()
  meta.sha256 = await CmdInvoke.sha256ByFilePath(dir + fileName)
  appData.fileMetaMapping[fileName] = meta
  appStore.setData(appData)

  updateFileMetaModifyTime(fileName)
}

export const deleteFileMeta = async (fileName: string) => {
  const appStore = useAppStore()
  const appData = appStore.data

  let meta = fileMeta
  if (Object.prototype.hasOwnProperty.call(appData.fileMetaMapping, fileName)) {
    meta = appData.fileMetaMapping[fileName]
  }
  meta.dtimeUtc = getTimestampMilliseconds()
  meta.mtimeUtc = 0

  appStore.setData(appData)
}

export const updateFileMetaModifyTime = async (fileName: string) => {
  const appStore = useAppStore()
  const appData = appStore.data

  let meta = fileMeta
  if (Object.prototype.hasOwnProperty.call(appData.fileMetaMapping, fileName)) {
    meta = appData.fileMetaMapping[fileName]
  }
  meta.mtimeUtc = getTimestampMilliseconds()
  appData.fileMetaMapping[fileName] = meta
  appStore.setData(appData)
}

const deleteFileInCurrentDir = async (fileName: string) => {
  const appStore = useAppStore()
  const filePath = appStore.data.dataPath.pathOfCurrentDir + fileName
  return await CmdInvoke.deleteFile(filePath)
}

export const saveToEntryFile = async () => {
  const t = i18n.global.t
  const saveEntryFileRes = await saveEntryFile()
  if (!saveEntryFileRes) {
    return t('&Failed to save file:', { fileName: getEntryFileName() })
  }
  return StrSignOk
}

export const saveCurrentNotebook = async (): Promise<string> => {
  const paneDataStore = usePaneDataStore()
  const t = i18n.global.t

  // Save current notebook, and record the sha256 into entry file
  return saveNotebookFile(true, '').then((saveNotebookRes) => {
    if (paneDataStore.data.itemsColumn.list.length > 0) {
      if (!saveNotebookRes) {
        return t('&Failed to save file:', { fileName: genCurrentNotebookFileName() })
      }
    }

    return saveToEntryFile()
  })
}

export const saveCurrentNotebookAndCreateNotebookFile = async (fileName: string): Promise<string> => {
  const sur = await saveCurrentNotebook()
  if (sur === StrSignOk) {
    return saveNotebookFile(false, fileName).then((saveRes) => {
      if (saveRes) {
        return StrSignOk
      } else {
        return StrSignErr
      }
    })
  }

  return sur
}

export const saveUserDataAndSync = async (): Promise<string> => {
  const sur = await saveCurrentNotebook()
  if (sur === StrSignOk) {
    const sud = new SyncUserData()
    return sud.run()
  }

  return sur
}

export const saveCurrentNotebookData = async () => {
  const t = i18n.global.t
  const errMsg = await saveCurrentNotebook()
  if (errMsg === StrSignOk) {
    ElMessage({
      message: t('OK'),
      type: 'success',
      showClose: true
    })
  } else {
    ElMessage({
      message: errMsg,
      type: 'error',
      showClose: true
    })
  }
}

export const deleteNotebook = async (hashedSign: string) => {
  const paneDataStore = usePaneDataStore()
  const navColData = paneDataStore.data.navigationColumn
  for (let index = 0; index < navColData.notebooks.length; index++) {
    // delete the data in paneData
    if (navColData.notebooks[index].hashedSign === hashedSign) {
      navColData.notebooks.splice(index, 1)
      paneDataStore.setNavigationColumnData(navColData)
    }
  }

  saveToEntryFile()
  deleteFileMeta(hashedSign)
  if (await deleteFileInCurrentDir(hashedSign)) {
    return true
  } else {
    return false
  }
}

export const deleteTag = async (hashedSign: string) => {
  const paneDataStore = usePaneDataStore()

  const navColData = paneDataStore.data.navigationColumn
  const itemsColData = paneDataStore.data.itemsColumn
  for (let ti = 0; ti < navColData.tags.length; ti++) {
    // Loop and delete tag of notebooks and notes
    for (let nbi = 0; nbi < navColData.notebooks.length; nbi++) {
      const nb = navColData.notebooks[nbi]
      const nbti = nb.tagsArr.indexOf(hashedSign)
      // Delete tag of notebook
      if (nbti >= 0) {
        nb.tagsArr.splice(nbti, 1)
        navColData.notebooks[nbi] = nb
      }

      // Delete tag of note
      // If the notebook is opened, just modify the pane data.
      if (itemsColData.hashedSign === nb.hashedSign) {
        for (let ici = 0; ici < itemsColData.list.length; ici++) {
          const item = itemsColData.list[ici]
          const iii = item.tagsArr.indexOf(hashedSign)
          if (iii >= 0) {
            itemsColData.list[ici].tagsArr.splice(iii, 1)
          }
        }
        paneDataStore.setItemsColumnData(itemsColData)
      } else {
        // Open the notebook file, loop and delete tag of notes.
        readNotebookdata(nb.hashedSign).then((notes) => {
          for (let ni = 0; ni < notes.length; ni++) {
            const note = notes[ni]
            const ntidx = note.tagsArr.indexOf(hashedSign)
            if (ntidx >= 0) {
              notes[ni].tagsArr.splice(ntidx, 1)
            }
          }
          saveNotebookFileWithContent(nb.hashedSign, genNotebookFileContent(notes))
        })
      }

      updateFileMetaModifyTime(nb.hashedSign)
    }

    // Loop and delete tag of attachments

    // delete the data in navigationColumn
    const tag = navColData.tags[ti]
    if (tag.hashedSign === hashedSign) {
      navColData.tags.splice(ti, 1)
    }
  }

  paneDataStore.setNavigationColumnData(navColData)

  saveCurrentNotebookData()
  if (await saveToEntryFile() === StrSignOk) {
    return true
  } else {
    return false
  }
}
