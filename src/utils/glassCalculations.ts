import type { GlassInvoiceData } from "../types"

/**
 * Calculates square meters (SQMS) from width (mm), height (mm), and pieces (pcs).
 * Formula: (width * height * pcs) / 1,000,000
 * Rounded to 4 decimal places.
 */
export const calculateMMtoSqms = (widthMM: number, heightMM: number, pcs: number = 1): number => {
  if (!widthMM || !heightMM || !pcs) return 0
  const sqms = (widthMM * heightMM * pcs) / 1000000
  return Number(sqms.toFixed(4))
}

/**
 * Converts MM dimensions to Fractional Inch string (e.g. 2115 x 1067 => "83 2/8 * 42 0/0")
 */
export const mmToFractionalInches = (mm: number): string => {
  if (!mm || mm <= 0) return "0 0/0"
  const inchesDecimal = mm / 25.4
  let inchesWhole = Math.floor(inchesDecimal)
  let eighths = Math.round((inchesDecimal - inchesWhole) * 8)
  if (eighths === 8) {
    inchesWhole += 1
    eighths = 0
  }
  return `${inchesWhole} ${eighths}/8`
}

export const formatGlassSizeInches = (widthMM: number, heightMM: number): string => {
  if (!widthMM || !heightMM) return ""
  const wInch = mmToFractionalInches(widthMM)
  const hInch = mmToFractionalInches(heightMM)
  return `${wInch} * ${hInch}`
}

/**
 * Calculates all summary totals for a Glass Processing Invoice
 */
export interface GlassTotals {
  totalPcs: number
  totalActualSqms: number
  totalChargedSqms: number
  totalGlassAmount: number
  totalGrindingAmount: number
  totalOtherCharges: number
  holeChargesAmount: number
  cutoutChargesAmount: number
  adminCharge: number
  assuranceChargeAmount: number
  assessableValue: number
  groupTotals: Array<{
    groupId: string
    pcs: number
    actualSqms: number
    chargedSqms: number
    glassAmount: number
    totalAmount: number
  }>
}

export const calculateGlassInvoiceTotals = (glassData?: GlassInvoiceData): GlassTotals => {
  if (!glassData || !glassData.groups) {
    return {
      totalPcs: 0,
      totalActualSqms: 0,
      totalChargedSqms: 0,
      totalGlassAmount: 0,
      totalGrindingAmount: 0,
      totalOtherCharges: 0,
      holeChargesAmount: 0,
      cutoutChargesAmount: 0,
      adminCharge: 0,
      assuranceChargeAmount: 0,
      assessableValue: 0,
      groupTotals: [],
    }
  }

  let grandPcs = 0
  let grandActualSqms = 0
  let grandChargedSqms = 0
  let grandGlassAmount = 0
  let grandGrindingAmount = 0
  let grandOtherCharges = 0

  const groupTotals = glassData.groups.map((group) => {
    let groupPcs = 0
    let groupActualSqms = 0
    let groupChargedSqms = 0
    let groupGlassAmount = 0
    let groupTotalAmount = 0

    group.items.forEach((item) => {
      const pcs = item.pcs || 0
      const actualSqms = item.actualSqms || calculateMMtoSqms(item.actualWidth, item.actualHeight, pcs)
      const chargedSqms = item.chargedSqms || calculateMMtoSqms(item.chargedWidth, item.chargedHeight, pcs)
      const glassAmount = item.glassAmount || Number((chargedSqms * (item.ratePerSqm || 0)).toFixed(2))
      const grindingAmount = item.grindingAmount || 0
      const otherCharges = item.otherCharges || 0
      const lineTotal = glassAmount + grindingAmount + otherCharges

      groupPcs += pcs
      groupActualSqms += actualSqms
      groupChargedSqms += chargedSqms
      groupGlassAmount += glassAmount
      groupTotalAmount += lineTotal
    })

    grandPcs += groupPcs
    grandActualSqms += groupActualSqms
    grandChargedSqms += groupChargedSqms
    grandGlassAmount += groupGlassAmount
    grandGrindingAmount += 0
    grandOtherCharges += 0

    return {
      groupId: group.id,
      pcs: groupPcs,
      actualSqms: Number(groupActualSqms.toFixed(4)),
      chargedSqms: Number(groupChargedSqms.toFixed(4)),
      glassAmount: Number(groupGlassAmount.toFixed(2)),
      totalAmount: Number(groupTotalAmount.toFixed(2)),
    }
  })

  // Extra charges calculation
  const holeChargesAmount = glassData.holeChargesAmount || ((glassData.holeChargesCount || 0) * (glassData.holeChargesRate || 0))
  const cutoutChargesAmount = glassData.cutoutChargesAmount || ((glassData.cutoutChargesCount || 0) * (glassData.cutoutChargesRate || 0))
  const adminCharge = glassData.adminCharge || 0

  // Total base glass & direct charges before assurance
  const baseTotal = grandGlassAmount + grandGrindingAmount + grandOtherCharges + holeChargesAmount + cutoutChargesAmount + adminCharge

  const assuranceRate = glassData.assuranceChargeRate || 0
  const assuranceChargeAmount = glassData.assuranceChargeAmount || Number(((baseTotal * assuranceRate) / 100).toFixed(2))

  const assessableValue = Number((baseTotal + assuranceChargeAmount).toFixed(2))

  return {
    totalPcs: grandPcs,
    totalActualSqms: Number(grandActualSqms.toFixed(4)),
    totalChargedSqms: Number(grandChargedSqms.toFixed(4)),
    totalGlassAmount: Number(grandGlassAmount.toFixed(2)),
    totalGrindingAmount: Number(grandGrindingAmount.toFixed(2)),
    totalOtherCharges: Number(grandOtherCharges.toFixed(2)),
    holeChargesAmount: Number(holeChargesAmount.toFixed(2)),
    cutoutChargesAmount: Number(cutoutChargesAmount.toFixed(2)),
    adminCharge: Number(adminCharge.toFixed(2)),
    assuranceChargeAmount: Number(assuranceChargeAmount.toFixed(2)),
    assessableValue,
    groupTotals,
  }
}
