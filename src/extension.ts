import {
  commands,
  ExtensionContext,
  languages,
  StatusBarAlignment,
  window,
  workspace
} from 'vscode'
import * as vscode from 'vscode'

import { CompletionProvider } from './providers/completion'
import { init } from './init'
import { SidebarProvider } from './providers/sidebar'
import { delayExecution, deleteTempFiles } from './utils'
import { getContext, setContext } from './context'
import { EXTENSION_NAME, MESSAGE_KEY } from './constants'

export async function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration('twinny')
  const fimModel = config.get('fimModelName') as string
  const chatModel = config.get('chatModelName') as string
  const statusBar = window.createStatusBarItem(StatusBarAlignment.Right)
  setContext(context)

  try {
    await init()
  } catch (e) {
    console.error(e)
  }

  statusBar.text = '🤖'
  statusBar.tooltip = `twinny is running: fim: ${fimModel} chat: ${chatModel}`

  const completionProvider = new CompletionProvider(statusBar)
  const sidebarProvider = new SidebarProvider(context.extensionUri, statusBar)

  context.subscriptions.push(
    languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      completionProvider
    ),
    commands.registerCommand('twinny.enable', () => {
      statusBar.show()
    }),
    commands.registerCommand('twinny.disable', () => {
      statusBar.hide()
    }),
    commands.registerCommand('twinny.explain', () => {
      commands.executeCommand('workbench.view.extension.twinny-sidebar-view')
      delayExecution(() =>
        sidebarProvider.streamService?.streamTemplateCompletion('explain')
      )
    }),
    commands.registerCommand('twinny.fixCode', () => {
      commands.executeCommand('workbench.view.extension.twinny-sidebar-view')
      delayExecution(() =>
        sidebarProvider.streamService?.streamTemplateCompletion('fix-code')
      )
    }),
    commands.registerCommand('twinny.stopGeneration', () => {
      completionProvider.destroyStream()
    }),
    commands.registerCommand('twinny.addTypes', () => {
      commands.executeCommand('workbench.view.extension.twinny-sidebar-view')
      delayExecution(() =>
        sidebarProvider.streamService?.streamTemplateCompletion('add-types')
      )
    }),
    commands.registerCommand('twinny.refactor', () => {
      commands.executeCommand('workbench.view.extension.twinny-sidebar-view')
      delayExecution(() =>
        sidebarProvider.streamService?.streamTemplateCompletion('refactor')
      )
    }),
    commands.registerCommand('twinny.addTests', () => {
      commands.executeCommand('workbench.view.extension.twinny-sidebar-view')
      delayExecution(() =>
        sidebarProvider.streamService?.streamTemplateCompletion('add-tests')
      )
    }),
    commands.registerCommand('twinny.generateDocs', () => {
      commands.executeCommand('workbench.view.extension.twinny-sidebar-view')
      delayExecution(() =>
        sidebarProvider.streamService?.streamTemplateCompletion('generate-docs')
      )
    }),
    commands.registerCommand('twinny.settings', () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        EXTENSION_NAME
      )
    }),
    commands.registerCommand('twinny.enableDownload', () => {
      sidebarProvider.setGlobalContext(getContext(), {
        key: MESSAGE_KEY.downloadCancelled,
        data: false
      })
      vscode.window.showInformationMessage(
        'twinny automatic model download enabled.'
      )
    }),
    commands.registerCommand('twinny.newChat', () => {
      sidebarProvider.setTwinnyWorkspaceContext(getContext(), {
        key: MESSAGE_KEY.lastConversation,
        data: []
      })
      sidebarProvider.getTwinnyWorkspaceContext(getContext(), {
        key: MESSAGE_KEY.lastConversation
      })
    }),
    window.registerWebviewViewProvider('twinny-sidebar', sidebarProvider),
    statusBar
  )

  if (config.get('enabled')) {
    statusBar.show()
  }

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration('twinny')) {
        return
      }

      completionProvider.updateConfig()
    })
  )
}

export function deactivate() {
  deleteTempFiles()
}
