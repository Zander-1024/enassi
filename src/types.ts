import { UserDataInfo } from '@/libs/user_data/types'
import { CurrentFileInfo, ListColInfo, NavColInfo } from '@/components/pane/types'
import { TimeHashedSignType } from '@/utils/hash'

export type TextDirectionInfo = 'LTR' | 'RTL'

export enum AppModeInfo {
    App = 'app',
    Web = 'web',
    Desktop = 'desktop',
    Empty = '',
    Mobile = 'mobile'
}

export type AppCoreConfInfo = {
    appName: string
    defaultLanguage: string,
    defaultLanguageInNative: string,
    homeAppDir: string
    homeDir: string
    version: string
}

export type ChangeMasterPasswordStatusInfo = {
    action: string
    percent: number

    currentNumber: number
    totalNumber: number
}

export type ProgressItemInfo = {
    percent: number
    color: string
}

export type CurrentProgressInfo = {
    percent: number
    taskName: string
}

export type DataPathInfo = {
    separator: string,
    pathOfHomeAppData: string;
    pathOfHome: string;
}

export type ExtDataPathInfo = {
    pathOfHome: string,
    pathOfHomeAppData: string,
    pathOfConfig: string,
    pathOfConfigStartUp: string,
    pathOfCurrentDir: string,
    pathOfSyncDir: string,
    pathOfSyncCachedDir: string,
    pathOfSyncDownloadDir: string,
    // style
    pathOfCustomStyle: string,
    pathOfCustomBackgroundImage: string
}

export type SettingInfo = {
    normal: {
        showFileSavingStatus: boolean
        spellCheck: boolean
        workDir: string
    },
    appearance: {
        dateTimeFormat: string
        locale: string
        listColShowCreateTime: boolean
        listColShowUpdateTime: boolean
        listColSortBy: 'title' | 'mtimeUtc' | 'ctimeUtc'
        listColSortOrder: 'ASC' | 'DESC'
        theme: string
    },
    encryption: {
        masterPassword: string
        enableFileCompress: boolean
        entryFileName: string
        fileExt: string
        fileNameRule: keyof typeof TimeHashedSignType
        syncLockFileName: string
    }
}

export type SettingOfStartUpInfo = {
    appearance: {
        locale: string
        theme: string
    },
}

export type AppInfo = {
    appMode: AppModeInfo // desktop mode or mobile mode
    appName: string
    changeLocaleTimestamp: number // record timestamp for editor i18n
    changeMasterPasswordStatus: ChangeMasterPasswordStatusInfo
    currentFile: CurrentFileInfo
    currentProgress: CurrentProgressInfo
    currentTheme: string
    dataPath: DataPathInfo
    defaultLocale: string,
    defaultLocaleInNative: string,
    editorFullScreen: boolean
    existConfigFile: boolean
    isWebPage: boolean
    listCol: ListColInfo
    navCol: NavColInfo
    lockscreen: boolean
    settings: SettingInfo
    textDirection: TextDirectionInfo
    userData: UserDataInfo
    version: string
}

export enum MessagesInfo {
    FileVerificationFailed = 'File verification failed',
    FileStillInProgress = '&have task in progress'
}
