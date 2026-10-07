using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.XR.Management;
using UnityEditor.XR.Management.Metadata;
using UnityEngine;
using UnityEngine.XR.Management;

public static class BuildQuest
{
    public static void BuildAndroid()
    {
        string output = Path.GetFullPath("../TENDA-Quest.apk");
        Directory.CreateDirectory(Path.GetDirectoryName(output));

        EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);
        PlayerSettings.companyName = "TENDA";
        PlayerSettings.productName = "TENDA 360";
        PlayerSettings.applicationIdentifier = "com.tenda.apartamento360";
        PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
        PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
        PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel29;

        ConfigureOpenXR();

        BuildReport report = BuildPipeline.BuildPlayer(
            new[] { "Assets/Scenes/Main.unity" },
            output,
            BuildTarget.Android,
            BuildOptions.None);

        if (report.summary.result != BuildResult.Succeeded)
            throw new System.Exception($"APK build failed: {report.summary.result}");

        Debug.Log($"APK criado em: {output}");
        }

    private static void ConfigureOpenXR()
    {
        var buildTargetSettings = AssetDatabase.LoadAssetAtPath<XRGeneralSettingsPerBuildTarget>(
            "Assets/XR/XRGeneralSettingsPerBuildTarget.asset");
        if (buildTargetSettings == null)
            throw new System.Exception("Arquivo de configuração XR não foi criado pelo Unity.");
        if (!buildTargetSettings.HasSettingsForBuildTarget(BuildTargetGroup.Android))
            buildTargetSettings.CreateDefaultSettingsForBuildTarget(BuildTargetGroup.Android);

        if (!buildTargetSettings.HasManagerSettingsForBuildTarget(BuildTargetGroup.Android))
            buildTargetSettings.CreateDefaultManagerSettingsForBuildTarget(BuildTargetGroup.Android);

        var manager = buildTargetSettings.ManagerSettingsForBuildTarget(BuildTargetGroup.Android);
        const string openXrLoader = "UnityEngine.XR.OpenXR.OpenXRLoader";
        if (!XRPackageMetadataStore.IsLoaderAssigned(openXrLoader, BuildTargetGroup.Android))
        {
            if (!XRPackageMetadataStore.AssignLoader(manager, openXrLoader, BuildTargetGroup.Android))
                throw new System.Exception("Não foi possível configurar o carregador OpenXR para Android.");
        }

        AssetDatabase.SaveAssets();
    }
}
