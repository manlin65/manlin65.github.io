unit Rabatt;

interface

function DiscountPercent(Amount: Integer): Integer;

implementation

function DiscountPercent(Amount: Integer): Integer;
begin
  if Amount >= 100 then
    Result := 10
  else if Amount >= 50 then
    Result := 5
  else
    Result := 0;
end;

end.
