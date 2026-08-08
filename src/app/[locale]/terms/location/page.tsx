export default function LocationTermsPage() {
  return (
    <div className="px-6 py-6 text-[14px] leading-relaxed text-[#333]">
      <h1 className="mb-6 text-[20px] font-bold text-[#111]">위치기반서비스 이용약관</h1>

      <Section title="제1조 (목적)">
        이 약관은 다올스테이션(이하 “회사”)이 제공하는 위치기반서비스의 이용과 관련하여 회사와
        이용자의 권리·의무 및 책임 사항을 규정하는 것을 목적으로 합니다. 본 약관은 「위치정보의 보호
        및 이용 등에 관한 법률」을 준수합니다.
      </Section>

      <Section title="제2조 (용어의 정의)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            “위치정보”란 이동성 있는 물건 또는 개인의 위치 및 현재 위치를 파악할 수 있는 정보를
            말합니다.
          </li>
          <li>“위치기반서비스”란 위치정보를 이용하여 제공하는 서비스를 말합니다.</li>
          <li>
            “위치정보사업자”란 위치정보를 수집하여 위치기반서비스사업자에게 제공하는 자를 말합니다.
          </li>
        </ol>
      </Section>

      <Section title="제3조 (위치기반서비스의 내용)">
        <p className="mb-2">회사는 이용자의 위치 정보를 이용하여 다음 서비스를 제공합니다.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>현재 위치 기반 주변 장소 검색 및 추천</li>
          <li>여행지 장소 정보 조회 및 거리 안내</li>
          <li>AI 기반 위치 맞춤 여행 일정 추천</li>
        </ul>
      </Section>

      <Section title="제4조 (위치정보의 수집·이용·제공)">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>수집 항목</strong>: 이용자 단말기의 위치 정보 (GPS, Wi-Fi, 이동통신망 기반)
          </li>
          <li>
            <strong>수집 목적</strong>: 위치기반 장소 검색, 주변 여행지 추천, 여행 일정 생성
          </li>
          <li>
            <strong>수집 방법</strong>: 이용자가 서비스 내 위치 관련 기능을 사용할 때에만 수집하며,
            앱 외부에서는 수집하지 않습니다.
          </li>
          <li>
            <strong>보유 기간</strong>: 서비스 제공 목적 달성 즉시 파기. 단, 관련 법령에서 보존을
            요구하는 경우 해당 기간 동안 보유합니다.
          </li>
          <li>
            <strong>제3자 제공</strong>: 위치정보는 Google Places API를 통해 장소 정보 조회에
            활용되며, Google의 개인정보처리방침이 적용됩니다.
          </li>
        </ol>
      </Section>

      <Section title="제5조 (위치정보 수집·이용·제공사실 확인자료 보유)">
        회사는 위치정보의 보호 및 이용 등에 관한 법률 제16조 제2항에 따라 이용자의 위치정보
        수집·이용·제공 사실을 자동으로 기록하고 보존하며, 해당 자료는 6개월 동안 보관합니다.
      </Section>

      <Section title="제6조 (이용자의 권리)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>이용자는 언제든지 위치기반서비스 이용에 대한 동의를 철회할 수 있습니다.</li>
          <li>이용자가 동의를 철회하는 경우 위치 기반 기능 일부가 제한될 수 있습니다.</li>
          <li>
            이용자는 위치정보 수집·이용·제공에 대한 동의의 전부 또는 일부를 유보할 수 있습니다.
          </li>
          <li>위치정보 관련 문의는 아래 위치정보관리책임자에게 연락하시기 바랍니다.</li>
        </ol>
      </Section>

      <Section title="제7조 (위치정보관리책임자)">
        <ul className="list-none space-y-1">
          <li>성명: [위치정보관리책임자명]</li>
          <li>소속: 다올스테이션</li>
          <li>이메일: [이메일]</li>
        </ul>
      </Section>

      <Section title="제8조 (손해배상 및 면책)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            회사는 위치정보의 이용·제공과 관련한 이용자의 손해를 배상합니다. 단, 회사의 고의 또는
            과실이 없는 경우에는 예외로 합니다.
          </li>
          <li>
            회사는 천재지변, 불가항력적인 사유로 인한 서비스 중단에 대해서는 책임을 지지 않습니다.
          </li>
        </ol>
      </Section>

      <div className="mt-8 text-[12px] text-[#999]">
        <p>시행일: 2025년 1월 1일</p>
        <p className="mt-1">회사: 다올스테이션</p>
        <p>대표: [대표자명]</p>
        <p>주소: [주소]</p>
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
