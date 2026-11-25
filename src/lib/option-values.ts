export const optionValues = <T extends readonly { value: string }[]>(
  options: T
) =>
  options.map((option) => option.value) as [
    T[number]["value"],
    ...T[number]["value"][],
  ]
