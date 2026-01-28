export function getCurrentFinancialYearStartYear(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return month >= 4 ? year : year - 1
}

export function buildFinancialYearLabel(startYear) {
  return `April ${startYear} to March ${startYear + 1}`
}

export function buildFinancialYearOptions(startYear, count = 6) {
  return Array.from({ length: count }, (_, index) => {
    const year = startYear + index
    return {
      value: String(year),
      text: buildFinancialYearLabel(year)
    }
  })
}

export function getAfterMarchYear(startYear, count = 6) {
  return startYear + count
}
