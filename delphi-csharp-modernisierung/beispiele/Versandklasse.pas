unit Versandklasse;

interface

function ShippingClass(Grams: Integer): Integer;

implementation

function ShippingClass(Grams: Integer): Integer;
begin
  // -1 kennzeichnet ein unzulässiges Gewicht.
  if Grams <= 0 then
    Result := -1
  else if Grams <= 500 then
    Result := 1
  else if Grams <= 2000 then
    Result := 2
  else if Grams <= 10000 then
    Result := 3
  else if Grams <= 31500 then
    Result := 4
  else
    Result := -1;
end;

end.
