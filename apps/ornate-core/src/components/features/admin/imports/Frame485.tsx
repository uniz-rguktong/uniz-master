import svgPaths from "./svg-euzf7b5l36";

function Icon() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon">
          <path d={svgPaths.p1d820380} id="Vector" stroke="var(--stroke-0, #3B82F6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p27451300} id="Vector_2" stroke="var(--stroke-0, #3B82F6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p2981fe00} id="Vector_3" stroke="var(--stroke-0, #3B82F6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d={svgPaths.p161d4800} id="Vector_4" stroke="var(--stroke-0, #3B82F6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </g>
      </svg>
    </div>);

}

function Container() {
  return (
    <div className="bg-[#eff6ff] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[48px]" data-name="Container">
      <Icon />
    </div>);

}

function Frame() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col font-['Inter:Medium',sans-serif] font-medium gap-px items-start min-h-px min-w-px not-italic relative">
      <p className="css-4hzbpn leading-[24px] relative shrink-0 text-[#6b7280] text-[16px] w-full">Total Registrations</p>
      <p className="css-4hzbpn leading-[28px] relative shrink-0 text-[#1a1a1a] text-[20px] w-full">466</p>
    </div>);

}

function Frame2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[24px] items-center min-h-px min-w-px relative">
      <Container />
      <Frame />
    </div>);

}

function Frame1() {
  return (
    <div className="bg-white h-[114px] relative rounded-bl-[6px] rounded-br-[6px] rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[25px] relative size-full">
          <Frame2 />
        </div>
      </div>
    </div>);

}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p3155f180} id="Vector" stroke="var(--stroke-0, #22C55E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.pea6a680} id="Vector_2" stroke="var(--stroke-0, #22C55E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>);

}

function Text() {
  return (
    <div className="flex-[1_0_0] h-[20px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute css-ew64yg font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] left-0 not-italic text-[#22c55e] text-[14px] top-[0.5px] tracking-[-0.1504px]">+12%</p>
      </div>
    </div>);

}

function Container1() {
  return (
    <div className="content-stretch flex gap-[4px] h-[20px] items-center relative shrink-0 w-[58.352px]" data-name="Container">
      <Icon1 />
      <Text />
    </div>);

}

export default function Frame3() {
  return (
    <div className="bg-[#f4f2f0] content-stretch flex flex-col gap-[17px] items-end p-[10px] relative rounded-[10px] size-full">
      <Frame1 />
      <Container1 />
    </div>);

}