Shader "TENDA/Panorama Inside"
{
    Properties { _MainTex ("Panorama", 2D) = "white" {} }
    SubShader
    {
        Tags { "Queue"="Background" "RenderType"="Opaque" }
        Cull Front
        Lighting Off
        ZWrite Off
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"
            sampler2D _MainTex;
            struct appdata { float4 vertex : POSITION; float2 uv : TEXCOORD0; };
            struct v2f { float4 pos : SV_POSITION; float2 uv : TEXCOORD0; };
            v2f vert(appdata v) { v2f o; o.pos = UnityObjectToClipPos(v.vertex); o.uv = float2(1 - v.uv.x, v.uv.y); return o; }
            fixed4 frag(v2f i) : SV_Target { return tex2D(_MainTex, i.uv); }
            ENDCG
        }
    }
}
