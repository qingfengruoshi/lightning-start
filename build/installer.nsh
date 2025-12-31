!include "nsProcess.nsh"

!macro customUnInstall
  ${nsProcess::FindProcess} "${PRODUCT_NAME}.exe" $R0
  ${If} $R0 == 0
    MessageBox MB_ICONQUESTION|MB_YESNO "${PRODUCT_NAME} 正在运行。$\n$\n是否立即关闭并继续卸载？" IDYES close IDNO abort
    close:
      ${nsProcess::KillProcess} "${PRODUCT_NAME}.exe" $R0
      Goto end
    abort:
      Abort
    end:
    MessageBox MB_ICONQUESTION|MB_YESNO "是否同时彻底删除所有用户数据（包括配置、插件和历史记录）？$\n$\n删除后将无法恢复。" IDNO check_done
    ; Ensure we are looking at the current user's APPDATA
    SetShellVarContext current
    ; Wait a bit for file locks to release if we just killed the process
    Sleep 1000 
    RMDir /r "$APPDATA\${PRODUCT_NAME}"
    check_done:
  ${EndIf}
!macroend
