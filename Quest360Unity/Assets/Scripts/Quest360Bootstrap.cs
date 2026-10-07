using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.XR;

public sealed class Quest360Bootstrap : MonoBehaviour
{
    private readonly string[] files = {
        "SALA_A.jpg", "COZINHA_A.jpg", "CORREDOR_A.jpg",
        "BANHEIRO_A.jpg", "QUARTO_CASAL_A.jpg", "QUARTO_SOLTEIRO_A.jpg"
    };

    private int current;
    private Texture2D texture;
    private Material material;
    private GameObject sphere;
    private bool previousX;
    private bool previousY;
    private bool previousA;
    private bool previousB;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    private static void Create()
    {
        new GameObject("TENDA 360 App").AddComponent<Quest360Bootstrap>();
    }

    private IEnumerator Start()
    {
        Application.targetFrameRate = 72;
        QualitySettings.vSyncCount = 0;

        Camera camera = Camera.main;
        if (camera == null)
        {
            camera = new GameObject("Main Camera").AddComponent<Camera>();
            camera.tag = "MainCamera";
        }
        camera.transform.position = Vector3.zero;
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = Color.black;

        sphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        sphere.name = "Panorama Sphere";
        sphere.transform.localScale = Vector3.one * 5f;
        Destroy(sphere.GetComponent<Collider>());

        material = new Material(Shader.Find("TENDA/Panorama Inside"));
        sphere.GetComponent<MeshRenderer>().sharedMaterial = material;
        yield return LoadPanorama(0);
    }

    private IEnumerator LoadPanorama(int index)
    {
        string path = Path.Combine(Application.streamingAssetsPath, "Panoramas", files[index]);
        using (UnityWebRequest request = UnityWebRequestTexture.GetTexture(path))
        {
            yield return request.SendWebRequest();
            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Falha ao carregar panorama: " + request.error);
                yield break;
            }

            if (texture != null) Destroy(texture);
            texture = DownloadHandlerTexture.GetContent(request);
            material.mainTexture = texture;
            current = index;
        }
    }

    private void Update()
    {
        Camera headCamera = Camera.main;
        if (headCamera != null)
        {
            headCamera.transform.localPosition = InputTracking.GetLocalPosition(XRNode.Head);
            headCamera.transform.localRotation = InputTracking.GetLocalRotation(XRNode.Head);
        }

        InputDevice left = InputDevices.GetDeviceAtXRNode(XRNode.LeftHand);
        InputDevice right = InputDevices.GetDeviceAtXRNode(XRNode.RightHand);
        bool x = Read(left, CommonUsages.primaryButton);
        bool y = Read(left, CommonUsages.secondaryButton);
        bool a = Read(right, CommonUsages.primaryButton);
        bool b = Read(right, CommonUsages.secondaryButton);

        if (x && !previousX) StartCoroutine(LoadPanorama((current + 1) % files.Length));
        if (y && !previousY) Application.Quit();
        if (a && !previousA) AdjustZoom(-5f);
        if (b && !previousB) AdjustZoom(5f);

        previousX = x;
        previousY = y;
        previousA = a;
        previousB = b;
    }

    private static bool Read(InputDevice device, InputFeatureUsage<bool> usage)
    {
        return device.isValid && device.TryGetFeatureValue(usage, out bool value) && value;
    }

    private static void AdjustZoom(float amount)
    {
        Camera camera = Camera.main;
        if (camera == null) return;
        camera.fieldOfView = Mathf.Clamp(camera.fieldOfView + amount, 45f, 90f);
    }
}
