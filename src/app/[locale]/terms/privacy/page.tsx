export default function PrivacyPolicyPage() {
  return (
    <div className="px-6 py-6 text-[14px] leading-relaxed text-[#333]">
      <h1 className="mb-6 text-[20px] font-bold text-[#111]">개인정보처리방침</h1>

      <p className="mb-6 text-[#555]">
        다올스테이션(이하 “회사”)은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」,
        「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다. 본 방침은
        회사가 제공하는 가다올 서비스에 적용됩니다.
      </p>

      <Section title="1. 수집하는 개인정보의 항목">
        <p className="mb-2">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#F8F8F8]">
              <Th>구분</Th>
              <Th>수집항목</Th>
              <Th>필수/선택</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>회원가입 (이메일)</Td>
              <Td>이메일 주소, 비밀번호, 닉네임, 전화번호</Td>
              <Td>필수</Td>
            </tr>
            <tr>
              <Td>소셜 로그인 (카카오)</Td>
              <Td>카카오 계정 ID, 이메일, 닉네임</Td>
              <Td>필수</Td>
            </tr>
            <tr>
              <Td>소셜 로그인 (Google)</Td>
              <Td>Google 계정 ID, 이메일, 이름</Td>
              <Td>필수</Td>
            </tr>
            <tr>
              <Td>서비스 이용</Td>
              <Td>여행 일정, 경비 정보, 여행 스타일, 장소 정보</Td>
              <Td>선택</Td>
            </tr>
            <tr>
              <Td>자동 수집</Td>
              <Td>서비스 이용 기록, 접속 로그, 기기 정보</Td>
              <Td>자동</Td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="2. 개인정보의 수집 및 이용목적">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>회원 가입 및 본인 확인</li>
          <li>서비스 제공 및 맞춤형 콘텐츠 제공 (AI 여행 추천, 일정 관리 등)</li>
          <li>서비스 개선 및 신규 기능 개발</li>
          <li>유료 서비스 결제 및 이용 관리</li>
          <li>공지사항 전달 및 고객 문의 처리</li>
          <li>서비스 부정이용 방지 및 법적 의무 이행</li>
        </ol>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용기간">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>회원 탈퇴 시까지</strong>: 회원가입 정보, 서비스 이용 데이터
          </li>
          <li>
            <strong>관련 법령에 따른 보존기간</strong>:
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>계약 또는 청약철회에 관한 기록: 5년 (전자상거래법)</li>
              <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
              <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p className="mb-2">
          회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는
          예외로 합니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 따라 수사기관 등이 요청하는 경우</li>
        </ul>
      </Section>

      <Section title="5. 개인정보 처리 위탁">
        <p className="mb-2">회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다.</p>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#F8F8F8]">
              <Th>수탁업체</Th>
              <Th>위탁 업무</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>Supabase, Inc.</Td>
              <Td>데이터베이스 및 인증 서비스 운영</Td>
            </tr>
            <tr>
              <Td>Google LLC</Td>
              <Td>장소 정보 API, 지도 서비스</Td>
            </tr>
            <tr>
              <Td>Vercel Inc.</Td>
              <Td>서버 호스팅 및 배포</Td>
            </tr>
            <tr>
              <Td>카카오(주)</Td>
              <Td>카카오 소셜 로그인 인증</Td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="6. 이용자의 권리">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.</li>
          <li>이용자는 개인정보의 수집·이용에 대한 동의를 철회하거나 삭제를 요청할 수 있습니다.</li>
          <li>개인정보 삭제는 앱 내 회원 탈퇴 기능을 통해 처리할 수 있습니다.</li>
          <li>개인정보 관련 문의는 아래 개인정보보호책임자에게 연락하시기 바랍니다.</li>
        </ol>
      </Section>

      <Section title="7. 개인정보보호책임자">
        <ul className="list-none space-y-1">
          <li>성명: [개인정보보호책임자명]</li>
          <li>소속: 다올스테이션</li>
          <li>이메일: [이메일]</li>
        </ul>
      </Section>

      <Section title="8. 쿠키(Cookie) 사용">
        <p>
          회사는 서비스 운영을 위해 쿠키를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버가
          이용자의 브라우저에게 보내는 소량의 정보이며, 이용자의 기기에 저장됩니다. 이용자는
          브라우저 설정을 통해 쿠키 허용 여부를 선택할 수 있습니다.
        </p>
      </Section>

      <div className="mt-8 text-[12px] text-[#999]">
        <p>시행일: 2025년 1월 1일</p>
        <p className="mt-1">회사: 다올스테이션</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2.5 text-[15px] font-bold text-[#111]">{title}</h2>
      <div className="text-[#555]">{children}</div>
    </section>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border border-[#E5E5E5] px-2.5 py-2 text-left text-[12px] font-semibold text-[#333]">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-[#E5E5E5] px-2.5 py-2 text-[12px] text-[#555]">{children}</td>
}
