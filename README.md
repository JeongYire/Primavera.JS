# PrimaveraJS
Primavera P6 XML Format Parser

#소개
Primavera P6 를 XML 형식으로 Export 된것을 분석한후, 콜백함수를 통해 결과물을 리턴합니다.
이는 공정데이터를 웹상에서 분석할 수 있게 도와주고, 효율적인 업무를 할 수 있게 해줍니다.

#사용법
필요한 매개변수는 총 세가지입니다.

1. Input File
OnChange 를 통해서 파일을 감지하고,
XML 파일인것을 확인하면 분석을 시작합니다.

2. Callback Event
분석이 끝나고 난후, 이 이벤트에 결과물을 넣고선 호출합니다.

3. Construction Code
PrimaveraJS 는 공정 데이터를 출력하는것이 목적이기 때문에, 
마일스톤 이나 다른 업무에 관한것은 분석하지 않습니다.
이 매개변수에는 Primavera P6 상에 존재하는 공정 액티비티 아이디들의 공통된 앞자리를 넣으시면 됩니다. 

#오류

1. 매개변수가 존재하지 않는경우
2. 매개변수에 지정된 데이터타입이 올바르지 않는경우 
3. Input 태그가 File 속성을 갖고있지 않는경우
4. CallbackEvent 가 존재하지 않는경우
