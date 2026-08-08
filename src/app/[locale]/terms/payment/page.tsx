export default function PaymentTermsPage() {
  return (
    <div className="px-6 py-6 text-[14px] leading-relaxed text-[#333]">
      <h1 className="mb-6 text-[20px] font-bold text-[#111]">유료서비스 이용약관</h1>

      <Section title="제1조 (목적)">
        이 약관은 다올스테이션(이하 “회사”)이 제공하는 가다올 서비스의 유료 구독 플랜(이하
        “유료서비스”)의 이용에 관한 사항을 규정함을 목적으로 합니다.
      </Section>

      <Section title="제2조 (유료 플랜의 종류 및 요금)">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#F8F8F8]">
              <Th>플랜</Th>
              <Th>월 이용료</Th>
              <Th>주요 혜택</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>Pro</Td>
              <Td>₩3,900</Td>
              <Td>컬렉션, 초대, 경비관리, 복수 여행지, AI 검색·추천 등</Td>
            </tr>
            <tr>
              <Td>Plus</Td>
              <Td>₩6,900</Td>
              <Td>Pro 포함 + AI 음성 일정 생성, AI 자동 일정 생성</Td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-[#777]">
          ※ 이용요금은 회사의 사정에 따라 변경될 수 있으며, 변경 시 사전 고지합니다.
        </p>
      </Section>

      <Section title="제3조 (결제 방법)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>유료서비스는 월 단위 자동 결제 방식으로 운영됩니다.</li>
          <li>결제는 이용자가 등록한 신용카드 또는 체크카드를 통해 이루어집니다.</li>
          <li>결제일은 최초 구독일을 기준으로 매월 동일한 일자에 청구됩니다.</li>
          <li>
            결제 실패 시 회사는 이용자에게 안내하며, 결제가 완료될 때까지 유료서비스 이용이 제한될
            수 있습니다.
          </li>
        </ol>
      </Section>

      <Section title="제4조 (구독 해지)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>이용자는 언제든지 앱 내 구독 관리 화면에서 구독을 해지할 수 있습니다.</li>
          <li>
            구독을 해지하면 현재 결제 기간이 종료되는 시점까지 유료서비스를 이용할 수 있습니다.
          </li>
          <li>
            해지한 이후 남은 기간에 대한 요금은 환불되지 않습니다. 단, 아래 제5조의 청약철회 기간에
            해당하는 경우는 예외입니다.
          </li>
        </ol>
      </Section>

      <Section title="제5조 (청약철회 및 환불)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            이용자는 유료서비스 결제일로부터 <strong>7일 이내</strong>에 청약을 철회할 수 있습니다.
            단, 다음의 경우에는 청약 철회가 제한됩니다.
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>결제 이후 유료서비스를 실질적으로 이용한 경우</li>
              <li>
                디지털 콘텐츠의 일부를 이미 제공받은 경우로서, 사전에 청약철회 불가 사실을 고지한
                경우
              </li>
            </ul>
          </li>
          <li>
            청약철회 기간 내 환불을 원하시는 경우, 고객센터(이메일: [이메일])로 문의하시기 바랍니다.
          </li>
          <li>
            환불은 결제 취소 처리를 통해 이루어지며, 카드사 정책에 따라 영업일 기준 3~5일이 소요될
            수 있습니다.
          </li>
        </ol>
      </Section>

      <Section title="제6조 (플랜 변경)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            이용자는 앱 내에서 상위 플랜으로 업그레이드하거나 하위 플랜으로 다운그레이드할 수
            있습니다.
          </li>
          <li>
            업그레이드 시 변경일부터 새 플랜이 즉시 적용되며, 차액은 일할 계산하여 청구됩니다.
          </li>
          <li>다운그레이드 시 현재 결제 기간이 종료된 후 새 플랜이 적용됩니다.</li>
        </ol>
      </Section>

      <Section title="제7조 (서비스 중단에 따른 보상)">
        회사의 귀책사유로 유료서비스가 연속 24시간 이상 중단된 경우, 이용자는 중단된 시간에 비례하여
        이용요금 감액을 요청할 수 있습니다. 단, 천재지변, 불가항력, 이용자 귀책사유로 인한 중단은
        제외합니다.
      </Section>

      <Section title="제8조 (약관의 변경)">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.</li>
          <li>약관을 변경하는 경우, 회사는 변경 내용 및 시행일을 시행일 30일 전에 공지합니다.</li>
          <li>이용자가 변경된 약관에 동의하지 않을 경우 구독을 해지할 수 있습니다.</li>
        </ol>
      </Section>

      <div className="mt-8 text-[12px] text-[#999]">
        <p>시행일: 2025년 1월 1일</p>
        <p className="mt-1">회사: 다올스테이션</p>
        <p>대표: [대표자명]</p>
        <p>이메일: [이메일]</p>
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
